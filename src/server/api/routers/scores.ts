import { TRPCError } from "@trpc/server";
import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { submittedScorecards } from "@/server/api/judging-results";
import {
	adminProcedure,
	createTRPCRouter,
	judgeProcedure,
	protectedProcedure
} from "@/server/api/trpc";
import { member } from "@/server/db/auth-schema";
import {
	hackathonSettings,
	judgingAssignments,
	judgingRoomStaff,
	judgingRooms,
	judgingRounds,
	scores
} from "@/server/db/schema";
import { criteria } from "@/server/db/scores-schema";

async function requireAssignmentAccess(
	ctx: {
		db: typeof import("@/server/db").db;
		session: { user: { id: string; role?: string | null } };
	},
	assignmentId: string
) {
	const assignment = await ctx.db.query.judgingAssignments.findFirst({
		where: eq(judgingAssignments.id, assignmentId),
		with: { room: { with: { staff: true } } }
	});
	if (!assignment)
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "Assignment not found."
		});
	if (
		ctx.session.user.role !== "admin" &&
		!assignment.room.staff.some(
			(staff) => staff.staffId === ctx.session.user.id
		)
	) {
		throw new TRPCError({
			code: "FORBIDDEN",
			message: "You are not assigned to score this team."
		});
	}
	return assignment;
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
			.innerJoin(
				sql`${submittedScorecards} AS submitted`,
				and(
					eq(scores.assignmentId, sql`submitted.assignment_id`),
					eq(scores.judgeId, sql`submitted.judge_id`)
				)
			)
			.where(eq(judgingAssignments.teamId, membership.organizationId))
			.groupBy(judgingRounds.id, scores.criteriaId);
		return { released: true, rounds: rows };
	}),
	// Get all scores
	getAll: adminProcedure.query(async ({ ctx }) => {
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
			await requireAssignmentAccess(ctx, input.assignmentId);
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
	getByTeam: adminProcedure
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
					scores: { where: eq(scores.judgeId, ctx.session.user.id) }
				},
				orderBy: (assignments, { asc }) => [asc(assignments.timeSlot)]
			});
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

			const assignment = await requireAssignmentAccess(ctx, assignmentId);
			// Submission identity always comes from the authenticated session.
			if (
				!assignment.room.staff.some(
					(staff) => staff.staffId === ctx.session.user.id
				)
			) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Only assigned judges can submit a scorecard."
				});
			}
			const criteriaIds = new Set(input.map((item) => item.criteriaId));
			const criteriaRows = await ctx.db.query.criteria.findMany();
			if (criteriaIds.size !== input.length) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Each criterion must be scored exactly once."
				});
			}
			if (
				criteriaRows.length !== input.length ||
				criteriaRows.some((criterion) => !criteriaIds.has(criterion.id))
			) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message:
						"Complete every criterion in the current rubric before submitting."
				});
			}
			if (
				assignment.timeSlot &&
				assignment.timeSlot > new Date() &&
				ctx.session.user.role !== "admin"
			) {
				const existing = await ctx.db.query.scores.findFirst({
					where: and(
						eq(scores.assignmentId, assignmentId),
						eq(scores.judgeId, ctx.session.user.id)
					)
				});
				if (!existing)
					throw new TRPCError({
						code: "FORBIDDEN",
						message: "Scoring opens at the team's scheduled time."
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
						judgeId: ctx.session.user.id,
						assignmentId: item.assignmentId,
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
				score: z.number().int().min(0).optional()
			})
		)
		.mutation(async ({ ctx, input }) => {
			const existing = await ctx.db.query.scores.findFirst({
				where: eq(scores.id, input.id)
			});
			if (!existing || existing.judgeId !== ctx.session.user.id) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You can only edit your own scores."
				});
			}
			await requireAssignmentAccess(ctx, existing.assignmentId);
			const criterion = await ctx.db.query.criteria.findFirst({
				where: eq(criteria.id, existing.criteriaId)
			});
			if (
				!criterion ||
				input.score === undefined ||
				input.score > criterion.maxScore
			) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Choose a score within the criterion's range."
				});
			}
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
