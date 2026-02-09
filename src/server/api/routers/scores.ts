import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import {
	createTRPCRouter,
	protectedProcedure,
	publicProcedure,
} from "@/server/api/trpc";
import { judgingAssignments, scores } from "@/server/db/schema";

export const scoresRouter = createTRPCRouter({
	// Get all scores
	getAll: publicProcedure.query(async ({ ctx }) => {
		const allScores = await ctx.db.query.scores.findMany({
			with: {
				assignment: {
					with: {
						judge: true,
						team: true,
						round: true,
					},
				},
			},
			orderBy: (scores, { desc }) => [desc(scores.createdAt)],
		});
		return allScores;
	}),

	// Get scores by assignment ID
	getByAssignment: publicProcedure
		.input(z.object({ assignmentId: z.string().uuid() }))
		.query(async ({ ctx, input }) => {
			const assignmentScores = await ctx.db.query.scores.findMany({
				where: eq(scores.assignmentId, input.assignmentId),
				with: {
					assignment: {
						with: {
							judge: true,
							team: true,
							round: true,
						},
					},
				},
			});
			return assignmentScores;
		}),

	// Get scores by team ID (across all rounds and judges)
	getByTeam: publicProcedure
		.input(z.object({ teamId: z.string() }))
		.query(async ({ ctx, input }) => {
			const teamScores = await ctx.db.query.scores.findMany({
				where: (scores, { eq }) =>
					eq(
						sql`(SELECT team_id FROM ${judgingAssignments} WHERE id = ${scores.assignmentId})`,
						input.teamId,
					),
				with: {
					assignment: {
						with: {
							judge: true,
							team: true,
							round: true,
						},
					},
				},
			});
			return teamScores;
		}),

	// Get scores by round ID
	getByRound: publicProcedure
		.input(z.object({ roundId: z.string().uuid() }))
		.query(async ({ ctx, input }) => {
			const roundScores = await ctx.db.query.scores.findMany({
				where: (scores, { eq }) =>
					eq(
						sql`(SELECT round_id FROM ${judgingAssignments} WHERE id = ${scores.assignmentId})`,
						input.roundId,
					),
				with: {
					assignment: {
						with: {
							judge: true,
							team: true,
							round: true,
						},
					},
				},
			});
			return roundScores;
		}),

	// Get aggregated scores by team (useful for leaderboards)
	getAggregatedByTeam: publicProcedure
		.input(
			z.object({
				roundId: z.string().uuid().optional(),
			}),
		)
		.query(async ({ ctx, input }) => {
			// This is a more complex query that aggregates scores by team
			const query = ctx.db
				.select({
					teamId: judgingAssignments.teamId,
					totalScore: sql<number>`SUM(${scores.value})`.as("total_score"),
					averageScore: sql<number>`AVG(${scores.value})`.as("average_score"),
					scoreCount: sql<number>`COUNT(${scores.id})`.as("score_count"),
				})
				.from(scores)
				.innerJoin(
					judgingAssignments,
					eq(scores.assignmentId, judgingAssignments.id),
				)
				.groupBy(judgingAssignments.teamId);

			if (input.roundId) {
				query.where(eq(judgingAssignments.roundId, input.roundId));
			}

			const aggregated = await query;
			return aggregated;
		}),

	// Submit a score
	create: protectedProcedure
		.input(
			z.object({
				assignmentId: z.string().uuid(),
				criteriaId: z.string().uuid(),
				score: z.number().int().min(0),
				feedback: z.string().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const [newScore] = await ctx.db
				.insert(scores)
				.values({
					assignmentId: input.assignmentId,
					criteriaId: input.criteriaId,
					value: input.score,
					feedback: input.feedback,
				})
				.returning();
			return newScore;
		}),

	// Update a score
	update: protectedProcedure
		.input(
			z.object({
				id: z.string().uuid(),
				criteria: z.string().min(1).optional(),
				score: z.number().int().min(0).optional(),
				feedback: z.string().optional().nullable(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const { id, ...data } = input;
			const [updated] = await ctx.db
				.update(scores)
				.set(data)
				.where(eq(scores.id, id))
				.returning();
			return updated;
		}),

	// Delete a score
	delete: protectedProcedure
		.input(z.object({ id: z.string().uuid() }))
		.mutation(async ({ ctx, input }) => {
			await ctx.db.delete(scores).where(eq(scores.id, input.id));
			return { success: true };
		}),
});
