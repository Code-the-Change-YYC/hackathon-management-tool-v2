import { TRPCError } from "@trpc/server";
import { eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import {
	criterionAppliesToRound,
	getFinalistStartTime,
	getFinalRoundEndTime,
	MAX_PRESENTATION_MINUTES
} from "@/lib/judging";
import { type PanelScorecard, rankPanelTeams } from "@/lib/judging-ranking";
import { scheduleFinalists } from "@/server/api/final-round";
import { submittedScorecards } from "@/server/api/judging-results";
import { assertRoundHasNoScores } from "@/server/api/routers/judging-tables";
import { adminProcedure, createTRPCRouter } from "@/server/api/trpc";
import { organization, user } from "@/server/db/auth-schema";
import {
	judgingAssignments,
	judgingCriteria,
	judgingRounds,
	judgingScores,
	judgingTableJudges,
	judgingTables
} from "@/server/db/judging-schema";

export const judgingResultsRouter = createTRPCRouter({
	// Normalized ranking used to pick finalists, next to the raw averages
	getPanelRanking: adminProcedure
		.input(z.object({ roundId: z.string().uuid() }))
		.query(async ({ ctx, input }) => {
			const cards = (await ctx.db.execute(sql`
    SELECT card.team_id AS "teamId", card.judge_id AS "judgeId", card.main_score AS "score"
    FROM ${submittedScorecards} card
    WHERE card.round_id = ${input.roundId}
   `)) as unknown as PanelScorecard[];
			// Each sidepot is its own award, so it gets its own normalized ranking.
			const sidepotCards = (await ctx.db.execute(sql`
    SELECT card.team_id AS "teamId", card.judge_id AS "judgeId",
     s.criteria_id AS "criterionId", s.value AS "score"
    FROM ${submittedScorecards} card
    INNER JOIN ${judgingScores} s
     ON s.assignment_id = card.assignment_id AND s.judge_id = card.judge_id
    INNER JOIN ${judgingCriteria} c ON c.id = s.criteria_id
    WHERE card.round_id = ${input.roundId} AND c.is_sidepot = true
   `)) as unknown as (PanelScorecard & { criterionId: string })[];
			const sidepotCriteria = (
				await ctx.db.query.judgingCriteria.findMany({
					where: eq(judgingCriteria.isSidepot, true),
					orderBy: (criteria, { asc }) => [
						asc(criteria.displayOrder),
						asc(criteria.name)
					]
				})
			).filter((criterion) =>
				criterionAppliesToRound(criterion, input.roundId)
			);

			const tables = await ctx.db.query.judgingTables.findMany({
				where: eq(judgingTables.roundId, input.roundId),
				with: {
					judges: { columns: { judgeId: true } },
					assignments: {
						columns: {},
						with: { team: { columns: { id: true, name: true } } }
					}
				}
			});
			const teams = new Map<
				string,
				{ teamName: string; expectedScorecards: number }
			>();
			for (const table of tables) {
				for (const { team } of table.assignments) {
					const entry = teams.get(team.id) ?? {
						teamName: team.name,
						expectedScorecards: 0
					};
					entry.expectedScorecards += table.judges.length;
					teams.set(team.id, entry);
				}
			}

			function withTeams(scorecards: PanelScorecard[]) {
				const ranking = rankPanelTeams(scorecards);
				const ranked = ranking.map((entry) => ({
					...entry,
					teamName: teams.get(entry.teamId)?.teamName ?? "Unknown team",
					expectedScorecards: teams.get(entry.teamId)?.expectedScorecards ?? 0
				}));
				const unscored = [...teams]
					.filter(
						([teamId]) => !ranking.some((entry) => entry.teamId === teamId)
					)
					.map(([teamId, team]) => ({
						teamId,
						normalizedScore: null,
						rawAverage: null,
						scorecardCount: 0,
						...team
					}));
				return [...ranked, ...unscored];
			}

			return {
				main: withTeams(cards),
				sidepots: sidepotCriteria.map((criterion) => ({
					criterionId: criterion.id,
					name: criterion.name,
					ranking: withTeams(
						sidepotCards.filter((card) => card.criterionId === criterion.id)
					)
				}))
			};
		}),

	// Seats every judge at the final round's one table, with finalists
	// presenting in the given order from the round's start
	setFinalists: adminProcedure
		.input(z.object({ teamIds: z.array(z.string()).min(1) }))
		.mutation(async ({ ctx, input }) => {
			if (new Set(input.teamIds).size !== input.teamIds.length) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Each finalist may only appear once."
				});
			}

			return ctx.db.transaction(async (tx) => {
				const round = await tx.query.judgingRounds.findFirst({
					where: eq(judgingRounds.kind, "final")
				});
				if (!round) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "Add a final round before picking finalists."
					});
				}
				await assertRoundHasNoScores(tx, round.id);
				const teams = await tx.query.organization.findMany({
					where: inArray(organization.id, input.teamIds),
					columns: { id: true }
				});
				if (teams.length !== input.teamIds.length) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "One or more finalists were not found."
					});
				}
				const judges = await tx.query.user.findMany({
					where: eq(user.role, "judge"),
					columns: { id: true }
				});
				if (judges.length === 0) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "There are no judges for the final round."
					});
				}

				const timing = {
					startTime: round.startTime,
					presentationMinutes:
						round.presentationMinutes ?? MAX_PRESENTATION_MINUTES,
					changeoverMinutes: round.changeoverMinutes
				};
				await tx
					.delete(judgingTables)
					.where(eq(judgingTables.roundId, round.id));
				const [table] = await tx
					.insert(judgingTables)
					.values({ roundId: round.id, tableNumber: 1 })
					.returning({ id: judgingTables.id });
				if (!table) {
					throw new TRPCError({
						code: "INTERNAL_SERVER_ERROR",
						message: "Failed to create the final table."
					});
				}
				await tx
					.insert(judgingTableJudges)
					.values(
						judges.map((judge) => ({ tableId: table.id, judgeId: judge.id }))
					);
				await scheduleFinalists(tx, table.id, input.teamIds, timing);
				// New finalists need republishing before teams see their times.
				await tx
					.update(judgingRounds)
					.set({
						...timing,
						endTime: getFinalRoundEndTime({
							...timing,
							finalistCount: input.teamIds.length
						}),
						publishedAt: null
					})
					.where(eq(judgingRounds.id, round.id));
				return { roundId: round.id };
			});
		}),

	// Moves finalists to new times without replacing their assignments, so
	// scores already submitted stay with their teams
	reorderFinalists: adminProcedure
		.input(z.object({ assignmentIds: z.array(z.string().uuid()).min(1) }))
		.mutation(async ({ ctx, input }) => {
			return ctx.db.transaction(async (tx) => {
				const round = await tx.query.judgingRounds.findFirst({
					where: eq(judgingRounds.kind, "final"),
					with: { tables: { with: { assignments: { columns: { id: true } } } } }
				});
				const table = round?.tables[0];
				if (!round || !table) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "Pick finalists before reordering them."
					});
				}
				const currentIds = new Set(table.assignments.map(({ id }) => id));
				const requestedIds = new Set(input.assignmentIds);
				if (
					requestedIds.size !== input.assignmentIds.length ||
					requestedIds.size !== currentIds.size ||
					input.assignmentIds.some((id) => !currentIds.has(id))
				) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "The finalists have changed. Refresh and try again."
					});
				}

				const timing = {
					startTime: round.startTime,
					presentationMinutes:
						round.presentationMinutes ?? MAX_PRESENTATION_MINUTES,
					changeoverMinutes: round.changeoverMinutes
				};
				// Start times are unique per table, so move every presentation out
				// of the way before giving each its new slot.
				await tx
					.update(judgingAssignments)
					.set({
						startsAt: sql`${judgingAssignments.startsAt} - interval '100 years'`
					})
					.where(eq(judgingAssignments.tableId, table.id));
				for (const [index, id] of input.assignmentIds.entries()) {
					await tx
						.update(judgingAssignments)
						.set({ startsAt: getFinalistStartTime(timing, index) })
						.where(eq(judgingAssignments.id, id));
				}
				return { roundId: round.id };
			});
		}),

	// The final round decides the winner on raw averages alone
	getFinalResults: adminProcedure.query(async ({ ctx }) => {
		const finalRound = await ctx.db.query.judgingRounds.findFirst({
			where: eq(judgingRounds.kind, "final")
		});
		if (!finalRound) return null;

		const results = (await ctx.db.execute(sql`
    SELECT o.id AS "teamId", o.name AS "teamName",
     AVG(card.main_score)::float8 AS "rawAverage",
     COUNT(*)::int AS "scorecardCount"
    FROM ${submittedScorecards} card
    INNER JOIN ${organization} o ON o.id = card.team_id
    WHERE card.round_id = ${finalRound.id}
    GROUP BY o.id, o.name
    ORDER BY "rawAverage" DESC, o.name ASC
   `)) as unknown as {
			teamId: string;
			teamName: string;
			rawAverage: number;
			scorecardCount: number;
		}[];
		return { round: finalRound, results };
	})
});
