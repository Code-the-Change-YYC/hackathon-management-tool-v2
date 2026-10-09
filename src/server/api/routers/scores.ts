import { TRPCError } from "@trpc/server";
import { and, eq, inArray, isNotNull, sql } from "drizzle-orm";
import { z } from "zod";
import {
	adminProcedure,
	type createTRPCContext,
	createTRPCRouter,
	judgeProcedure
} from "@/server/api/trpc";
import { organization } from "@/server/db/auth-schema";
import {
	judgingAssignments,
	judgingRoomStaff,
	judgingRooms,
	scores
} from "@/server/db/schema";
import { criteria } from "@/server/db/scores-schema";

type ScoreContext = Awaited<ReturnType<typeof createTRPCContext>>;

async function requireAssignment(
	db: ScoreContext["db"],
	assignmentId: string,
	judgeId: string
) {
	const assignment = await db.query.judgingAssignments.findFirst({
		where: eq(judgingAssignments.id, assignmentId),
		with: { room: { with: { staff: true } } }
	});
	if (!assignment)
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "Assignment not found."
		});
	if (!assignment.room.staff.some((member) => member.staffId === judgeId)) {
		throw new TRPCError({
			code: "FORBIDDEN",
			message: "You are not assigned to score this team."
		});
	}
}

function validateScore(criterion: typeof criteria.$inferSelect, value: number) {
	const min = criterion.isSidepot ? 0 : 1;
	const max = criterion.isSidepot ? criterion.maxScore : 10;
	if (value < min || value > max) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: `Score must be between ${min} and ${max} for this criterion.`
		});
	}
}

export const scoresRouter = createTRPCRouter({
	// Get all scores
	getAll: judgeProcedure.query(async ({ ctx }) => {
		const allScores = await ctx.db.query.scores.findMany({
			where:
				ctx.session.user.role === "admin"
					? undefined
					: eq(scores.judgeId, ctx.session.user.id),
			with: {
				assignment: {
					with: {
						team: true,
						room: {
							with: {
								round: true
							}
						}
					}
				}
			},
			orderBy: (scores, { desc }) => [desc(scores.createdAt)]
		});
		return allScores;
	}),

	// Get scores by assignment ID
	getByAssignment: judgeProcedure
		.input(z.object({ assignmentId: z.string().uuid() }))
		.query(async ({ ctx, input }) => {
			const assignmentScores = await ctx.db.query.scores.findMany({
				where: and(
					eq(scores.assignmentId, input.assignmentId),
					eq(scores.judgeId, ctx.session.user.id)
				),
				with: {
					assignment: {
						with: {
							team: true,
							room: {
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
			const teamScores = await ctx.db.query.scores.findMany({
				where: (scores, { eq }) =>
					and(
						ctx.session.user.role === "admin"
							? undefined
							: eq(scores.judgeId, ctx.session.user.id),
						eq(
							sql`(SELECT team_id FROM ${judgingAssignments} WHERE id = ${scores.assignmentId})`,
							input.teamId
						)
					),
				with: {
					assignment: {
						with: {
							team: true,
							room: {
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
			const judgeRoomsForRound = await ctx.db
				.select({ id: judgingRooms.id })
				.from(judgingRooms)
				.innerJoin(
					judgingRoomStaff,
					eq(judgingRoomStaff.roomId, judgingRooms.id)
				)
				.where(
					and(
						eq(judgingRooms.roundId, input.roundId),
						eq(judgingRoomStaff.staffId, ctx.session.user.id)
					)
				);

			const roomIds = judgeRoomsForRound.map((r) => r.id);

			if (roomIds.length === 0) return [];

			return ctx.db.query.judgingAssignments.findMany({
				where: (assignments, { inArray }) =>
					inArray(assignments.roomId, roomIds),
				with: {
					team: true,
					room: {
						with: {
							round: true
						}
					},
					scores: { where: eq(scores.judgeId, ctx.session.user.id) }
				},
				orderBy: (assignments, { asc }) => [asc(assignments.timeSlot)]
			});
		}),

	// One main-category total per judge and assignment; sidepots are separate awards.
	getJudgeTotals: judgeProcedure
		.input(z.object({ roundId: z.string().uuid() }))
		.query(async ({ ctx, input }) => {
			return ctx.db
				.select({
					assignmentId: scores.assignmentId,
					judgeId: scores.judgeId,
					teamId: judgingAssignments.teamId,
					mainTotal:
						sql<number>`coalesce(sum(${scores.value}) filter (where ${criteria.isSidepot} = false), 0)`.mapWith(
							Number
						),
					mainCriteriaScored:
						sql<number>`count(*) filter (where ${criteria.isSidepot} = false)`.mapWith(
							Number
						)
				})
				.from(scores)
				.innerJoin(
					judgingAssignments,
					eq(scores.assignmentId, judgingAssignments.id)
				)
				.innerJoin(judgingRooms, eq(judgingAssignments.roomId, judgingRooms.id))
				.innerJoin(criteria, eq(scores.criteriaId, criteria.id))
				.where(
					and(
						eq(judgingRooms.roundId, input.roundId),
						isNotNull(scores.judgeId),
						ctx.session.user.role === "admin"
							? undefined
							: eq(scores.judgeId, ctx.session.user.id)
					)
				)
				.groupBy(
					scores.assignmentId,
					scores.judgeId,
					judgingAssignments.teamId
				);
		}),

	// Get aggregated scores by team (useful for leaderboards)
	getAggregatedByTeam: judgeProcedure
		.input(
			z.object({
				roundId: z.string().uuid().optional()
			})
		)
		.query(async ({ ctx, input }) => {
			const results = await ctx.db
				.select({
					teamId: judgingAssignments.teamId,
					teamName: organization.name,

					normalTotal: sql<number>`SUM(CASE WHEN ${criteria.isSidepot} = false THEN ${scores.value} ELSE 0 END)`,
					normalAvg: sql<number>`AVG(CASE WHEN ${criteria.isSidepot} = false THEN ${scores.value} ELSE NULL END)`,

					sidepotTotal: sql<number>`SUM(CASE WHEN ${criteria.isSidepot} = true THEN ${scores.value} ELSE 0 END)`,
					sidepotAvg: sql<number>`AVG(CASE WHEN ${criteria.isSidepot} = true THEN ${scores.value} ELSE NULL END)`
				})
				.from(scores)
				.innerJoin(
					judgingAssignments,
					eq(scores.assignmentId, judgingAssignments.id)
				)
				.innerJoin(judgingRooms, eq(judgingAssignments.roomId, judgingRooms.id))
				.innerJoin(organization, eq(judgingAssignments.teamId, organization.id))
				.innerJoin(criteria, eq(scores.criteriaId, criteria.id))
				.where(
					and(
						input.roundId ? eq(judgingRooms.roundId, input.roundId) : undefined,
						isNotNull(scores.judgeId),
						ctx.session.user.role === "admin"
							? undefined
							: eq(scores.judgeId, ctx.session.user.id)
					)
				)
				.groupBy(judgingAssignments.teamId, organization.name);

			return results;
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

			await requireAssignment(ctx.db, assignmentId, ctx.session.user.id);

			const criteriaIds = [...new Set(input.map((item) => item.criteriaId))];
			if (criteriaIds.length !== input.length) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Each criterion may only appear once."
				});
			}
			const criteriaRows = await ctx.db.query.criteria.findMany({
				where: inArray(criteria.id, criteriaIds)
			});
			const criteriaById = new Map(criteriaRows.map((row) => [row.id, row]));

			for (const item of input) {
				const criterion = criteriaById.get(item.criteriaId);
				if (!criterion)
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "One or more criteria were not found."
					});
				validateScore(criterion, item.score);
			}

			const results = await ctx.db
				.insert(scores)
				.values(
					input.map((item) => ({
						assignmentId: item.assignmentId,
						judgeId: ctx.session.user.id,
						criteriaId: item.criteriaId,
						value: item.score
					}))
				)
				.onConflictDoUpdate({
					target: [scores.assignmentId, scores.criteriaId, scores.judgeId],
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
			const existing = await ctx.db.query.scores.findFirst({
				where: and(
					eq(scores.id, input.id),
					eq(scores.judgeId, ctx.session.user.id)
				),
				with: { criteria: true }
			});
			if (!existing)
				throw new TRPCError({ code: "NOT_FOUND", message: "Score not found." });
			await requireAssignment(
				ctx.db,
				existing.assignmentId,
				ctx.session.user.id
			);
			validateScore(existing.criteria, input.score);
			const [updated] = await ctx.db
				.update(scores)
				.set({ value: input.score })
				.where(
					and(eq(scores.id, input.id), eq(scores.judgeId, ctx.session.user.id))
				)
				.returning();
			return updated;
		}),

	// Delete a score
	delete: adminProcedure
		.input(z.object({ id: z.string().uuid() }))
		.mutation(async ({ ctx, input }) => {
			await ctx.db.delete(scores).where(eq(scores.id, input.id));
			return { success: true };
		})
});
