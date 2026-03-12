import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import {
	createTRPCRouter,
	protectedProcedure,
	publicProcedure
} from "@/server/api/trpc";
import { judgingRounds } from "@/server/db/schema";

export const judgingRoundsRouter = createTRPCRouter({
	// Get all judging rounds
	getAll: publicProcedure.query(async ({ ctx }) => {
		const rounds = await ctx.db.query.judgingRounds.findMany({
			orderBy: (rounds, { desc }) => [desc(rounds.startTime)]
		});
		return rounds;
	}),

	// Get a single judging round by ID
	getById: publicProcedure
		.input(z.object({ id: z.string().uuid() }))
		.query(async ({ ctx, input }) => {
			const round = await ctx.db.query.judgingRounds.findFirst({
				where: eq(judgingRounds.id, input.id),
				with: {
					rooms: {
						with: {
							assignments: true,
							staff: true
						}
					}
				}
			});
			return round;
		}),

	// Create a new judging round
	create: protectedProcedure
		.input(
			z
				.object({
					name: z.string().min(1),
					startTime: z.coerce.date(),
					endTime: z.coerce.date()
				})
				.refine((data) => data.endTime > data.startTime, {
					message: "End time must be after start time.",
					path: ["endTime"]
				})
		)
		.mutation(async ({ ctx, input }) => {
			const [round] = await ctx.db
				.insert(judgingRounds)
				.values(input)
				.returning();
			return round;
		}),

	// Update a judging round
	update: protectedProcedure
		.input(
			z.object({
				id: z.string().uuid(),
				name: z.string().min(1).optional(),
				startTime: z.coerce.date().optional(),
				endTime: z.coerce.date().optional()
			})
		)
		.mutation(async ({ ctx, input }) => {
			const { id, ...data } = input;

			if (data.startTime || data.endTime) {
				const existingRound = await ctx.db.query.judgingRounds.findFirst({
					where: eq(judgingRounds.id, id)
				});

				if (!existingRound) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Round not found."
					});
				}

				const nextStartTime = data.startTime ?? existingRound.startTime;
				const nextEndTime = data.endTime ?? existingRound.endTime;

				if (nextEndTime <= nextStartTime) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "End time must be after start time."
					});
				}
			}

			const [updated] = await ctx.db
				.update(judgingRounds)
				.set(data)
				.where(eq(judgingRounds.id, id))
				.returning();
			return updated;
		}),

	// Delete a judging round
	delete: protectedProcedure
		.input(z.object({ id: z.string().uuid() }))
		.mutation(async ({ ctx, input }) => {
			await ctx.db.delete(judgingRounds).where(eq(judgingRounds.id, input.id));
			return { success: true };
		})
});
