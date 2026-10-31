import { TRPCError } from "@trpc/server";
import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import {
	criterionAppliesToRound,
	MAIN_CRITERION_MAX_SCORE
} from "@/lib/judging";
import { submittedScorecards } from "@/server/api/judging-results";
import {
	adminProcedure,
	type createTRPCContext,
	createTRPCRouter,
	judgeProcedure,
	protectedProcedure
} from "@/server/api/trpc";
import { hackathonSettings } from "@/server/db/admin-schema";
import { member } from "@/server/db/auth-schema";
import {
	judgingAssignments,
	judgingCriteria,
	judgingRounds,
	judgingScores,
	judgingTableJudges,
	judgingTables
} from "@/server/db/judging-schema";

type ScoreContext = Awaited<ReturnType<typeof createTRPCContext>>;

async function requireAssignment(
	db: ScoreContext["db"],
	assignmentId: string,
	judgeId: string
) {
	const assignment = await db.query.judgingAssignments.findFirst({
		where: eq(judgingAssignments.id, assignmentId),
		with: { table: { with: { judges: true } } }
	});
	if (!assignment)
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "Assignment not found."
		});
	if (!assignment.table.judges.some((judge) => judge.judgeId === judgeId)) {
		throw new TRPCError({
			code: "FORBIDDEN",
			message: "You are not assigned to score this team."
		});
	}
	return assignment;
}

function validateScore(
	criterion: typeof judgingCriteria.$inferSelect,
	value: number,
	roundId: string
) {
	if (!criterionAppliesToRound(criterion, roundId)) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "Criterion is not available for this judging round."
		});
	}
	const min = criterion.isSidepot ? 0 : 1;
	const max = criterion.isSidepot
		? criterion.maxScore
		: MAIN_CRITERION_MAX_SCORE;
	if (value < min || value > max) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: `Score must be between ${min} and ${max} for this criterion.`
		});
	}
}

export const scoresRouter = createTRPCRouter({
	// Resolve membership on the server; unreleased results never reach the client.
	getMineReleased: protectedProcedure.query(async ({ ctx }) => {
		const settings = await ctx.db.query.hackathonSettings.findFirst({
			where: eq(hackathonSettings.id, 1)
		});
		if (settings?.judgingPhase !== "winners_announced")
			return { released: false, rounds: [] };
		const membership = await ctx.db.query.member.findFirst({
			where: eq(member.userId, ctx.session.user.id),
			columns: { organizationId: true }
		});
		if (!membership) return { released: true, rounds: [] };
		const rows = await ctx.db
			.select({
				roundId: judgingRounds.id,
				criterionId: judgingScores.criteriaId,
				value: sql<number>`avg(${judgingScores.value})::float8`
			})
			.from(judgingScores)
			.innerJoin(
				judgingAssignments,
				eq(judgingScores.assignmentId, judgingAssignments.id)
			)
			.innerJoin(
				judgingTables,
				eq(judgingAssignments.tableId, judgingTables.id)
			)
			.innerJoin(judgingRounds, eq(judgingTables.roundId, judgingRounds.id))
			.innerJoin(
				sql`${submittedScorecards} AS submitted`,
				and(
					eq(judgingScores.assignmentId, sql`submitted.assignment_id`),
					eq(judgingScores.judgeId, sql`submitted.judge_id`)
				)
			)
			.where(eq(judgingAssignments.teamId, membership.organizationId))
			.groupBy(judgingRounds.id, judgingScores.criteriaId);
		return { released: true, rounds: rows };
	}),
	// Get all scores
	getAll: judgeProcedure.query(async ({ ctx }) => {
		const allScores = await ctx.db.query.judgingScores.findMany({
			where:
				ctx.session.user.role === "admin"
					? undefined
					: eq(judgingScores.judgeId, ctx.session.user.id),
			with: {
				assignment: {
					with: {
						team: true,
						table: {
							with: {
								round: true
							}
						}
					}
				}
			},
			orderBy: (rows, { desc }) => [desc(rows.createdAt)]
		});
		return allScores;
	}),

	// Get scores by assignment ID
	getByAssignment: judgeProcedure
		.input(z.object({ assignmentId: z.string().uuid() }))
		.query(async ({ ctx, input }) => {
			await requireAssignment(ctx.db, input.assignmentId, ctx.session.user.id);
			const assignmentScores = await ctx.db.query.judgingScores.findMany({
				where: and(
					eq(judgingScores.assignmentId, input.assignmentId),
					eq(judgingScores.judgeId, ctx.session.user.id)
				),
				with: {
					assignment: {
						with: {
							team: true,
							table: {
								with: {
									round: true
								}
							}
						}
					}
				}
			});
			return assignmentScores;
		}),

	// Get scores by team ID (across all rounds and judges)
	getByTeam: judgeProcedure
		.input(z.object({ teamId: z.string() }))
		.query(async ({ ctx, input }) => {
			const teamScores = await ctx.db.query.judgingScores.findMany({
				where: (rows, { eq }) =>
					and(
						ctx.session.user.role === "admin"
							? undefined
							: eq(rows.judgeId, ctx.session.user.id),
						eq(
							sql`(SELECT team_id FROM ${judgingAssignments} WHERE id = ${rows.assignmentId})`,
							input.teamId
						)
					),
				with: {
					assignment: {
						with: {
							team: true,
							table: {
								with: {
									round: true
								}
							}
						}
					}
				}
			});
			return teamScores;
		}),

	// Get scores by round ID
	getByRound: judgeProcedure
		.input(z.object({ roundId: z.string().uuid() }))
		.query(async ({ ctx, input }) => {
			const judgeTablesForRound = await ctx.db
				.select({ id: judgingTables.id })
				.from(judgingTables)
				.innerJoin(
					judgingTableJudges,
					eq(judgingTableJudges.tableId, judgingTables.id)
				)
				.where(
					and(
						eq(judgingTables.roundId, input.roundId),
						eq(judgingTableJudges.judgeId, ctx.session.user.id)
					)
				);

			const tableIds = judgeTablesForRound.map((t) => t.id);

			if (tableIds.length === 0) return [];

			return ctx.db.query.judgingAssignments.findMany({
				where: (assignments, { inArray }) =>
					inArray(assignments.tableId, tableIds),
				with: {
					team: true,
					table: {
						with: {
							round: true
						}
					},
					scores: { where: eq(judgingScores.judgeId, ctx.session.user.id) }
				},
				orderBy: (assignments, { asc }) => [asc(assignments.startsAt)]
			});
		}),

	// One main-category total per judge and assignment; sidepots are separate awards.
	getJudgeTotals: judgeProcedure
		.input(z.object({ roundId: z.string().uuid() }))
		.query(async ({ ctx, input }) => {
			return ctx.db
				.select({
					assignmentId: judgingScores.assignmentId,
					judgeId: judgingScores.judgeId,
					teamId: judgingAssignments.teamId,
					mainTotal:
						sql<number>`coalesce(sum(${judgingScores.value}) filter (where ${judgingCriteria.isSidepot} = false), 0)`.mapWith(
							Number
						),
					mainCriteriaScored:
						sql<number>`count(*) filter (where ${judgingCriteria.isSidepot} = false)`.mapWith(
							Number
						)
				})
				.from(judgingScores)
				.innerJoin(
					judgingAssignments,
					eq(judgingScores.assignmentId, judgingAssignments.id)
				)
				.innerJoin(
					judgingTables,
					eq(judgingAssignments.tableId, judgingTables.id)
				)
				.innerJoin(
					judgingCriteria,
					eq(judgingScores.criteriaId, judgingCriteria.id)
				)
				.where(
					and(
						eq(judgingTables.roundId, input.roundId),
						ctx.session.user.role === "admin"
							? undefined
							: eq(judgingScores.judgeId, ctx.session.user.id)
					)
				)
				.groupBy(
					judgingScores.assignmentId,
					judgingScores.judgeId,
					judgingAssignments.teamId
				);
		}),

	// Organizer-only averages; judges never receive other judges' assessments.
	getAggregatedByTeam: adminProcedure
		.input(z.object({ roundId: z.string().uuid().optional() }))
		.query(async ({ ctx, input }) => {
			const result = await ctx.db.execute(sql`
    SELECT o.id AS "teamId", o.name AS "teamName",
     AVG(card.main_score)::float8 AS "normalAvg",
     AVG(card.sidepot_score)::float8 AS "sidepotAvg",
     COUNT(*)::int AS "submittedScorecards"
    FROM ${submittedScorecards} card
    INNER JOIN hackathon_organization o ON o.id = card.team_id
    ${input.roundId ? sql`WHERE card.round_id = ${input.roundId}` : sql``}
    GROUP BY o.id, o.name
   `);
			return result as unknown as {
				teamId: string;
				teamName: string;
				normalAvg: number;
				sidepotAvg: number;
				submittedScorecards: number;
			}[];
		}),

	// Submit a score
	createMany: judgeProcedure
		.input(
			z.array(
				z.object({
					assignmentId: z.string().uuid(),
					criteriaId: z.string().uuid(),
					score: z.number().int().min(0)
				})
			)
		)
		.mutation(async ({ ctx, input }) => {
			if (input.length === 0) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "At least one score is required."
				});
			}

			const assignmentIds = [
				...new Set(input.map((item) => item.assignmentId))
			];
			if (assignmentIds.length !== 1) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "All scores must belong to the same assignment."
				});
			}

			const assignmentId = assignmentIds[0];
			if (!assignmentId) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Assignment is required."
				});
			}

			const assignment = await requireAssignment(
				ctx.db,
				assignmentId,
				ctx.session.user.id
			);

			const criteriaIds = [...new Set(input.map((item) => item.criteriaId))];
			if (criteriaIds.length !== input.length) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Each criterion may only appear once."
				});
			}
			const criteriaRows = (
				await ctx.db.query.judgingCriteria.findMany()
			).filter((criterion) =>
				criterionAppliesToRound(criterion, assignment.table.roundId)
			);
			if (
				criteriaRows.length !== input.length ||
				criteriaRows.some((criterion) => !criteriaIds.includes(criterion.id))
			) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Complete every criterion for this round before submitting."
				});
			}
			if (assignment.startsAt > new Date()) {
				const existing = await ctx.db.query.judgingScores.findFirst({
					where: and(
						eq(judgingScores.assignmentId, assignmentId),
						eq(judgingScores.judgeId, ctx.session.user.id)
					)
				});
				if (!existing)
					throw new TRPCError({
						code: "FORBIDDEN",
						message: "Scoring opens at the team's scheduled time."
					});
			}
			const criteriaById = new Map(criteriaRows.map((row) => [row.id, row]));

			for (const item of input) {
				const criterion = criteriaById.get(item.criteriaId);
				if (!criterion)
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "One or more criteria were not found."
					});
				validateScore(criterion, item.score, assignment.table.roundId);
			}

			const results = await ctx.db
				.insert(judgingScores)
				.values(
					input.map((item) => ({
						assignmentId: item.assignmentId,
						judgeId: ctx.session.user.id,
						criteriaId: item.criteriaId,
						value: item.score
					}))
				)
				.onConflictDoUpdate({
					target: [
						judgingScores.assignmentId,
						judgingScores.criteriaId,
						judgingScores.judgeId
					],
					set: { value: sql`excluded.value` }
				})
				.returning();

			return results;
		}),

	// Update a score
	update: judgeProcedure
		.input(
			z.object({
				id: z.string().uuid(),
				score: z.number().int().min(0)
			})
		)
		.mutation(async ({ ctx, input }) => {
			const existing = await ctx.db.query.judgingScores.findFirst({
				where: and(
					eq(judgingScores.id, input.id),
					eq(judgingScores.judgeId, ctx.session.user.id)
				),
				with: { criteria: true }
			});
			if (!existing)
				throw new TRPCError({ code: "NOT_FOUND", message: "Score not found." });
			const assignment = await requireAssignment(
				ctx.db,
				existing.assignmentId,
				ctx.session.user.id
			);
			validateScore(existing.criteria, input.score, assignment.table.roundId);
			const [updated] = await ctx.db
				.update(judgingScores)
				.set({ value: input.score })
				.where(
					and(
						eq(judgingScores.id, input.id),
						eq(judgingScores.judgeId, ctx.session.user.id)
					)
				)
				.returning();
			return updated;
		}),

	// Delete a score
	delete: adminProcedure
		.input(z.object({ id: z.string().uuid() }))
		.mutation(async ({ ctx, input }) => {
			await ctx.db.delete(judgingScores).where(eq(judgingScores.id, input.id));
			return { success: true };
		})
});
