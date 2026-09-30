import { eq } from "drizzle-orm";
import { z } from "zod";
import { JUDGING_PHASES } from "@/lib/participant-events";
import {
	adminProcedure,
	createTRPCRouter,
	publicProcedure
} from "@/server/api/trpc";
import { hackathonSettings } from "@/server/db/schema";

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
				submissionDeadline: z.date().optional().nullable(),
				judgingPhase: z.enum(JUDGING_PHASES).optional(),
				timeZone: z
					.string()
					.refine((value) => {
						try {
							new Intl.DateTimeFormat("en", { timeZone: value });
							return true;
						} catch {
							return false;
						}
					}, "Enter a valid IANA time zone.")
					.optional(),
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
		})
});
