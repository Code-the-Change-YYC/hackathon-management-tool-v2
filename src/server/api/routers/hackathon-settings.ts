import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { JUDGING_PHASES } from "@/lib/judging";
import {
	countEventsOutside,
	eventsOutsideMessage,
	hackathonDatesSchema
} from "@/lib/validation/hackathon-dates";
import {
	adminProcedure,
	createTRPCRouter,
	publicProcedure
} from "@/server/api/trpc";
import { event } from "@/server/db/event-schema";
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
				judgingPhase: z.enum(JUDGING_PHASES).optional(),
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

	// Update the hackathon's start, end and submission deadline (admin only)
	updateDates: adminProcedure
		.input(hackathonDatesSchema)
		.mutation(async ({ ctx, input }) => {
			const events = await ctx.db
				.select({ startTime: event.startTime })
				.from(event);
			const { before, after } = countEventsOutside(
				events.map(({ startTime }) => startTime),
				input
			);
			if (before + after > 0) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: eventsOutsideMessage(before + after)
				});
			}

			const [updated] = await ctx.db
				.insert(hackathonSettings)
				.values({ id: 1, ...input })
				.onConflictDoUpdate({ target: hackathonSettings.id, set: input })
				.returning();
			return updated;
		})
});
