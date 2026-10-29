import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { assertRoundHasNoScores } from "@/server/api/routers/judging-tables";
import {
	adminProcedure,
	createTRPCRouter,
	protectedProcedure
} from "@/server/api/trpc";
import { judgingRounds, judgingTables } from "@/server/db/judging-schema";

export const judgingRoundsRouter = createTRPCRouter({
	// Get all judging rounds
	getAll: protectedProcedure.query(async ({ ctx }) => {
		const rounds = await ctx.db.query.judgingRounds.findMany({
			orderBy: (rounds, { desc }) => [desc(rounds.startTime)]
		});
		return rounds;
	}),

	// Create a new panel round; the final round comes from judgingResults.setFinalists
	create: adminProcedure
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
				.values({ ...input, kind: "panel" })
				.returning();
			return round;
		}),

	// Update a judging round
	update: adminProcedure
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

			await assertRoundHasNoScores(ctx.db, id);

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

	// Participants only see a round's schedule once it is published
	publish: adminProcedure
		.input(z.object({ id: z.string().uuid() }))
		.mutation(async ({ ctx, input }) => {
			const table = await ctx.db.query.judgingTables.findFirst({
				where: eq(judgingTables.roundId, input.id),
				columns: { id: true }
			});
			if (!table) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Generate a schedule before publishing this round."
				});
			}
			const [updated] = await ctx.db
				.update(judgingRounds)
				.set({ publishedAt: new Date() })
				.where(eq(judgingRounds.id, input.id))
				.returning();
			return updated;
		}),

	unpublish: adminProcedure
		.input(z.object({ id: z.string().uuid() }))
		.mutation(async ({ ctx, input }) => {
			const [updated] = await ctx.db
				.update(judgingRounds)
				.set({ publishedAt: null })
				.where(eq(judgingRounds.id, input.id))
				.returning();
			return updated;
		}),

	// Delete a judging round
	delete: adminProcedure
		.input(z.object({ id: z.string().uuid() }))
		.mutation(async ({ ctx, input }) => {
			await assertRoundHasNoScores(ctx.db, input.id);
			await ctx.db.delete(judgingRounds).where(eq(judgingRounds.id, input.id));
			return { success: true };
		})
});
