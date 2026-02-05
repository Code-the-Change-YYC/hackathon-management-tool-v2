import { eq } from "drizzle-orm";
import { z } from "zod";
import {
	createTRPCRouter,
	protectedProcedure,
	publicProcedure,
} from "@/server/api/trpc";
import { hackathonSettings } from "@/server/db/schema";

export const hackathonSettingsRouter = createTRPCRouter({
	// Get current hackathon settings
	get: publicProcedure.query(async ({ ctx }) => {
		const settings = await ctx.db.query.hackathonSettings.findFirst({
			where: eq(hackathonSettings.id, 1),
		});
		return settings;
	}),

	// Update hackathon settings (admin only - you may want to add role check)
	update: protectedProcedure
		.input(
			z.object({
				startDate: z.date().optional(),
				endDate: z.date().optional(),
				isActive: z.boolean().optional(),
				currentRoundId: z.string().uuid().optional().nullable(),
				metadata: z.string().optional().nullable(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const [updated] = await ctx.db
				.insert(hackathonSettings)
				.values({
					id: 1,
					...input,
				})
				.onConflictDoUpdate({
					target: hackathonSettings.id,
					set: input,
				})
				.returning();
			return updated;
		}),
});
