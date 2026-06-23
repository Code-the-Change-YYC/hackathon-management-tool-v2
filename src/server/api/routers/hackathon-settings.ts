import { eq } from "drizzle-orm";
import { z } from "zod";
import {
	adminProcedure,
	createTRPCRouter,
	publicProcedure
} from "@/server/api/trpc";
import {
	hackathonSettings,
	judgingAssignments,
	judgingRoomStaff,
	judgingRooms,
	judgingRounds,
	scores
} from "@/server/db/schema";
import { criteria } from "@/server/db/scores-schema";

export const hackathonSettingsRouter = createTRPCRouter({
	// Get current hackathon settings
	get: publicProcedure.query(async ({ ctx }) => {
		const settings = await ctx.db.query.hackathonSettings.findFirst({
			where: eq(hackathonSettings.id, 1)
		});
		return settings ?? null;
	}),

	// Update hackathon settings (admin only)
	update: adminProcedure
		.input(
			z.object({
				startDate: z.date().optional(),
				endDate: z.date().optional(),
				isActive: z.boolean().optional(),
				currentRoundId: z.string().uuid().optional().nullable()
			})
		)
		.mutation(async ({ ctx, input }) => {
			const [updated] = await ctx.db
				.insert(hackathonSettings)
				.values({
					id: 1,
					...input
				})
				.onConflictDoUpdate({
					target: hackathonSettings.id,
					set: input
				})
				.returning();
			return updated;
		}),

	// Reset hackathon settings
	reset: adminProcedure
		.input(
			z.object({
				confirmation: z.string()
			})
		)
		.mutation(async ({ ctx, input }) => {
			if (input.confirmation !== "i love code the change") {
				throw new Error("Invalid confirmation phrase");
			}

			// Delete everything from the database
			await ctx.db.transaction(async (tx) => {
				// delete scores first
				await tx.delete(scores);

				// delete assignments
				await tx.delete(judgingAssignments);

				// delete room staff
				await tx.delete(judgingRoomStaff);

				// delete rooms
				await tx.delete(judgingRooms);

				// delete rounds
				await tx.delete(judgingRounds);

				// delete criteria
				await tx.delete(criteria);

				// reset singleton settings
				await tx
					.update(hackathonSettings)
					.set({
						startDate: null,
						endDate: null,
						isActive: false,
						currentRoundId: null
					})
					.where(eq(hackathonSettings.id, 1));
			});

			return { success: true };
		})
});
