import { TRPCError } from "@trpc/server";
import { addMinutes } from "date-fns";
import { eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import { rankPanelTeams } from "@/lib/judging-ranking";
import { submittedScorecards } from "@/server/api/judging-results";
import { assertRoundHasNoScores } from "@/server/api/routers/judging-tables";
import { adminProcedure, createTRPCRouter } from "@/server/api/trpc";
import { organization, user } from "@/server/db/auth-schema";
import {
	judgingAssignments,
	judgingRounds,
	judgingTableJudges,
	judgingTables
} from "@/server/db/judging-schema";

type RoundScorecard = { teamId: string; judgeId: string; mainScore: number };

export const judgingResultsRouter = createTRPCRouter({
	// Normalized ranking used to pick finalists, next to the raw averages
	getPanelRanking: adminProcedure
		.input(z.object({ roundId: z.string().uuid() }))
		.query(async ({ ctx, input }) => {
			const cards = (await ctx.db.execute(sql`
    SELECT card.team_id AS "teamId", card.judge_id AS "judgeId", card.main_score AS "mainScore"
    FROM ${submittedScorecards} card
    WHERE card.round_id = ${input.roundId}
   `)) as unknown as RoundScorecard[];

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

			const ranking = rankPanelTeams(cards);
			const ranked = ranking.map((entry) => ({
				...entry,
				teamName: teams.get(entry.teamId)?.teamName ?? "Unknown team",
				expectedScorecards: teams.get(entry.teamId)?.expectedScorecards ?? 0
			}));
			const unscored = [...teams]
				.filter(([teamId]) => !ranking.some((entry) => entry.teamId === teamId))
				.map(([teamId, team]) => ({
					teamId,
					normalizedScore: null,
					rawAverage: null,
					scorecardCount: 0,
					...team
				}));
			return [...ranked, ...unscored];
		}),

	// Builds the single final round: one table of every judge, finalists in order
	setFinalists: adminProcedure
		.input(
			z.object({
				teamIds: z.array(z.string()).min(1),
				startTime: z.coerce.date(),
				presentationMinutes: z.number().int().min(1),
				changeoverMinutes: z.number().int().min(0).default(2)
			})
		)
		.mutation(async ({ ctx, input }) => {
			if (new Set(input.teamIds).size !== input.teamIds.length) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Each finalist may only appear once."
				});
			}

			return ctx.db.transaction(async (tx) => {
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

				const slotMinutes = input.presentationMinutes + input.changeoverMinutes;
				const roundValues = {
					name: "Final Round",
					kind: "final" as const,
					startTime: input.startTime,
					endTime: addMinutes(
						input.startTime,
						input.teamIds.length * slotMinutes - input.changeoverMinutes
					),
					publishedAt: null,
					presentationMinutes: input.presentationMinutes,
					changeoverMinutes: input.changeoverMinutes
				};

				const existing = await tx.query.judgingRounds.findFirst({
					where: eq(judgingRounds.kind, "final")
				});
				let roundId: string;
				if (existing) {
					await assertRoundHasNoScores(tx, existing.id);
					await tx
						.delete(judgingTables)
						.where(eq(judgingTables.roundId, existing.id));
					await tx
						.update(judgingRounds)
						.set(roundValues)
						.where(eq(judgingRounds.id, existing.id));
					roundId = existing.id;
				} else {
					const [created] = await tx
						.insert(judgingRounds)
						.values(roundValues)
						.returning({ id: judgingRounds.id });
					if (!created) {
						throw new TRPCError({
							code: "INTERNAL_SERVER_ERROR",
							message: "Failed to create the final round."
						});
					}
					roundId = created.id;
				}

				const [table] = await tx
					.insert(judgingTables)
					.values({ roundId, tableNumber: 1 })
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
				await tx.insert(judgingAssignments).values(
					input.teamIds.map((teamId, index) => ({
						teamId,
						tableId: table.id,
						startsAt: addMinutes(input.startTime, index * slotMinutes)
					}))
				);
				return { roundId };
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
