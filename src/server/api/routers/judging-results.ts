import { TRPCError } from "@trpc/server";
import { and, eq, inArray, notInArray, sql } from "drizzle-orm";
import { z } from "zod";
import {
	getFinalistStartTime,
	getFinalRoundEndTime,
	MAX_PRESENTATION_MINUTES
} from "@/lib/judging";
import {
	type PanelScorecard,
	rankFinalists,
	rankPanelTeams
} from "@/lib/judging-ranking";
import { scheduleFinalists } from "@/server/api/final-round";
import {
	getPanelScorecards,
	submittedScorecards
} from "@/server/api/judging-results";
import { areScoresReleased } from "@/server/api/participant-judging";
import { assertRoundHasNoScores } from "@/server/api/routers/judging-tables";
import { adminProcedure, createTRPCRouter } from "@/server/api/trpc";
import { hackathonSettings } from "@/server/db/admin-schema";
import { organization, user } from "@/server/db/auth-schema";
import {
	judgingAssignments,
	judgingCriteria,
	judgingRounds,
	judgingScores,
	judgingTableJudges,
	judgingTables,
	judgingVotes
} from "@/server/db/judging-schema";

export const judgingResultsRouter = createTRPCRouter({
	// Normalized ranking used to pick finalists, next to the raw averages
	getPanelRanking: adminProcedure
		.input(z.object({ roundId: z.string().uuid() }))
		.query(async ({ ctx, input }) => {
			const cards = await getPanelScorecards(ctx.db, input.roundId);
			// Each sidepot is its own award, so it gets its own normalized ranking.
			const sidepotCards = (await ctx.db.execute(sql`
    SELECT card.team_id AS "teamId", card.judge_id AS "judgeId",
     s.criteria_id AS "criterionId", s.value AS "score"
    FROM ${submittedScorecards} card
    INNER JOIN ${judgingScores} s
     ON s.assignment_id = card.assignment_id AND s.judge_id = card.judge_id
    INNER JOIN ${judgingCriteria} c ON c.id = s.criteria_id
    INNER JOIN ${organization} o ON o.id = card.team_id
    WHERE card.round_id = ${input.roundId} AND c.is_sidepot = true
     AND o.prescreen_status <> 'failed'
   `)) as unknown as (PanelScorecard & { criterionId: string })[];
			const sidepotCriteria = await ctx.db.query.judgingCriteria.findMany({
				where: eq(judgingCriteria.isSidepot, true),
				orderBy: (criteria, { asc }) => [
					asc(criteria.displayOrder),
					asc(criteria.name)
				]
			});

			const tables = await ctx.db.query.judgingTables.findMany({
				where: eq(judgingTables.roundId, input.roundId),
				with: {
					judges: { columns: { judgeId: true } },
					assignments: {
						columns: {},
						with: {
							team: { columns: { id: true, name: true, prescreenStatus: true } }
						}
					}
				}
			});
			const teams = new Map<
				string,
				{ teamName: string; expectedScorecards: number }
			>();
			// Failed teams can keep slots judges scored, but aren't ranked.
			const failedTeams = new Map<string, string>();
			for (const table of tables) {
				for (const { team } of table.assignments) {
					if (team.prescreenStatus === "failed") {
						failedTeams.set(team.id, team.name);
						continue;
					}
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
				failedTeamNames: [...failedTeams.values()].sort((a, b) =>
					a.localeCompare(b)
				),
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
					columns: { id: true, prescreenStatus: true }
				});
				if (teams.length !== input.teamIds.length) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "One or more finalists were not found."
					});
				}
				if (teams.some((team) => team.prescreenStatus !== "passed")) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "Finalists must have passed pre-screening."
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

	// Seats exactly these judges at the final table, so judges who left early
	// don't hold up the ballots. Judges who have ranked the finalists keep
	// their seats so their ballots keep counting.
	setFinalJudges: adminProcedure
		.input(z.object({ judgeIds: z.array(z.string()).min(1) }))
		.mutation(async ({ ctx, input }) => {
			const judgeIds = [...new Set(input.judgeIds)];
			return ctx.db.transaction(async (tx) => {
				const [round, settings] = await Promise.all([
					tx.query.judgingRounds.findFirst({
						where: eq(judgingRounds.kind, "final"),
						with: { tables: { columns: { id: true } } }
					}),
					tx.query.hackathonSettings.findFirst({
						where: eq(hackathonSettings.id, 1)
					})
				]);
				const table = round?.tables[0];
				if (!round || !table) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "Pick finalists before seating the final table."
					});
				}
				if (areScoresReleased(settings)) {
					throw new TRPCError({
						code: "FORBIDDEN",
						message: "The final table can’t change once scores are released."
					});
				}
				const judges = await tx.query.user.findMany({
					where: and(inArray(user.id, judgeIds), eq(user.role, "judge")),
					columns: { id: true }
				});
				if (judges.length !== judgeIds.length) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "One or more judges were not found."
					});
				}
				const voters = await tx
					.selectDistinct({ judgeId: judgingVotes.judgeId })
					.from(judgingVotes)
					.innerJoin(
						judgingAssignments,
						eq(judgingVotes.assignmentId, judgingAssignments.id)
					)
					.where(eq(judgingAssignments.tableId, table.id));
				if (voters.some(({ judgeId }) => !judgeIds.includes(judgeId))) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message:
							"Judges who have ranked the finalists have to stay at the final table."
					});
				}

				await tx
					.delete(judgingTableJudges)
					.where(
						and(
							eq(judgingTableJudges.tableId, table.id),
							notInArray(judgingTableJudges.judgeId, judgeIds)
						)
					);
				await tx
					.insert(judgingTableJudges)
					.values(judgeIds.map((judgeId) => ({ tableId: table.id, judgeId })))
					.onConflictDoNothing();
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

	// Ballot points decide the final; see rankFinalists for the tiebreakers.
	getFinalResults: adminProcedure.query(async ({ ctx }) => {
		const [finalRound, panelRound] = await Promise.all([
			ctx.db.query.judgingRounds.findFirst({
				where: eq(judgingRounds.kind, "final"),
				with: {
					tables: {
						with: {
							judges: {
								with: { judge: { columns: { id: true, name: true } } }
							},
							assignments: {
								with: {
									team: {
										columns: { id: true, name: true, prescreenStatus: true }
									},
									votes: true
								}
							}
						}
					}
				}
			}),
			ctx.db.query.judgingRounds.findFirst({
				where: eq(judgingRounds.kind, "panel"),
				columns: { id: true }
			})
		]);
		if (!finalRound) return null;

		const table = finalRound.tables[0];
		const finalists = (table?.assignments ?? [])
			.slice()
			.sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
		// Only judges still at the final table count.
		const judgeIds = new Set(table?.judges.map(({ judge }) => judge.id));
		const votes = finalists.flatMap((assignment) =>
			assignment.votes
				.filter((vote) => judgeIds.has(vote.judgeId))
				.map((vote) => ({
					teamId: assignment.team.id,
					judgeId: vote.judgeId,
					place: vote.place
				}))
		);
		const panelCards = panelRound
			? await getPanelScorecards(ctx.db, panelRound.id)
			: [];
		const panelScores = new Map(
			rankPanelTeams(panelCards).map((entry) => [
				entry.teamId,
				entry.normalizedScore
			])
		);
		const teamNames = new Map(
			finalists.map(({ team }) => [team.id, team.name])
		);
		// A finalist that failed pre-screening after judges ranked it can't
		// win, and votes for it don't count toward anyone else.
		const eligibleIds = new Set(
			finalists
				.filter(({ team }) => team.prescreenStatus !== "failed")
				.map(({ team }) => team.id)
		);

		return {
			results: rankFinalists(
				[...eligibleIds],
				votes.filter((vote) => eligibleIds.has(vote.teamId)),
				panelScores
			).map((entry) => ({
				...entry,
				teamName: teamNames.get(entry.teamId) ?? "Unknown team"
			})),
			// Every judge at the final table, with the teams they placed, from 1st.
			ballots: (table?.judges ?? [])
				.map(({ judge }) => ({
					judgeId: judge.id,
					judgeName: judge.name,
					teamNames: votes
						.filter((vote) => vote.judgeId === judge.id)
						.sort((a, b) => a.place - b.place)
						.map((vote) => teamNames.get(vote.teamId) ?? "Unknown team")
				}))
				.sort((a, b) => a.judgeName.localeCompare(b.judgeName))
		};
	})
});
