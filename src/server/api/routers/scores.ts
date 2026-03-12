import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import {
	adminProcedure,
	createTRPCRouter,
	judgeProcedure
} from "@/server/api/trpc";
import { organization } from "@/server/db/auth-schema";
import { judgingAssignments, judgingRooms, scores } from "@/server/db/schema";
import { criteria } from "@/server/db/scores-schema";

export const scoresRouter = createTRPCRouter({
	// Get all scores
	getAll: judgeProcedure.query(async ({ ctx }) => {
		const allScores = await ctx.db.query.scores.findMany({
			with: {
				assignment: {
					with: {
						team: true,
						room: true
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
							room: true
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
							room: true
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
			const roundScores = await ctx.db.query.judgingAssignments.findMany({
				where: (assignments) =>
					and(
						eq(judgingAssignments.roundId, input.roundId),
						eq(assignments.judgeId, ctx.session.user.id)
					),
				with: {
					team: true,
					scores: true
				}
			});
			return roundScores;
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
					score: z.number().int().min(0).max(10)
				})
			)
		)
		.mutation(async ({ ctx, input }) => {
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
