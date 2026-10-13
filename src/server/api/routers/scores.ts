import { TRPCError } from "@trpc/server";
import { and, eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import { criterionAppliesToRound } from "@/lib/judging";
import {
	adminProcedure,
	createTRPCRouter,
	judgeProcedure,
	protectedProcedure
} from "@/server/api/trpc";
import { member, organization } from "@/server/db/auth-schema";
import {
	hackathonSettings,
	judgingAssignments,
	judgingRoomStaff,
	judgingRooms,
	judgingRounds,
	scores
} from "@/server/db/schema";
import { criteria } from "@/server/db/scores-schema";

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
				criterionId: scores.criteriaId,
				value: sql<number>`avg(${scores.value})::float8`
			})
			.from(scores)
			.innerJoin(
				judgingAssignments,
				eq(scores.assignmentId, judgingAssignments.id)
			)
			.innerJoin(judgingRooms, eq(judgingAssignments.roomId, judgingRooms.id))
			.innerJoin(judgingRounds, eq(judgingRooms.roundId, judgingRounds.id))
			.where(eq(judgingAssignments.teamId, membership.organizationId))
			.groupBy(judgingRounds.id, scores.criteriaId);
		return { released: true, rounds: rows };
	}),
	// Get all scores
	getAll: judgeProcedure.query(async ({ ctx }) => {
		const allScores = await ctx.db.query.scores.findMany({
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
				where: eq(scores.assignmentId, input.assignmentId),
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
					eq(
						sql`(SELECT team_id FROM ${judgingAssignments} WHERE id = ${scores.assignmentId})`,
						input.teamId
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
					scores: true
				},
				orderBy: (assignments, { asc }) => [asc(assignments.timeSlot)]
			});
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
					input.roundId ? eq(judgingRooms.roundId, input.roundId) : undefined
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

			const assignment = await ctx.db.query.judgingAssignments.findFirst({
				where: eq(judgingAssignments.id, assignmentId),
				with: {
					room: {
						with: {
							staff: true
						}
					}
				}
			});

			if (!assignment) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Assignment not found."
				});
			}

			const isAdmin = ctx.session.user.role === "admin";
			const isAssignedJudge = assignment.room.staff.some(
				(member) => member.staffId === ctx.session.user.id
			);
			if (!(isAdmin || isAssignedJudge)) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You are not assigned to score this team."
				});
			}

			const criteriaIds = [...new Set(input.map((item) => item.criteriaId))];
			const criteriaRows = await ctx.db.query.criteria.findMany({
				where: inArray(criteria.id, criteriaIds)
			});
			if (
				criteriaRows.some(
					(criterion) =>
						!criterionAppliesToRound(criterion, assignment.room.roundId)
				)
			) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Criterion is not available for this judging round."
				});
			}
			const maxScoreByCriteriaId = new Map(
				criteriaRows.map((row) => [row.id, row.maxScore])
			);

			for (const item of input) {
				const maxScore = maxScoreByCriteriaId.get(item.criteriaId);
				if (maxScore === undefined) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "One or more criteria were not found."
					});
				}
				if (item.score > maxScore) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: `Score cannot exceed ${maxScore} for this criterion.`
					});
				}
			}

			const results = await ctx.db
				.insert(scores)
				.values(
					input.map((item) => ({
						assignmentId: item.assignmentId,
						criteriaId: item.criteriaId,
						value: item.score
					}))
				)
				.onConflictDoUpdate({
					target: [scores.assignmentId, scores.criteriaId],
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
				score: z.number().int().min(0).optional()
			})
		)
		.mutation(async ({ ctx, input }) => {
			const [updated] = await ctx.db
				.update(scores)
				.set({ value: input.score })
				.where(eq(scores.id, input.id))
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
