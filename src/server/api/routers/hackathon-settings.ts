import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getScoreReleaseBlocker } from "@/lib/judging";
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
import { hackathonSettings } from "@/server/db/admin-schema";
import { event } from "@/server/db/event-schema";
import { judgingRounds } from "@/server/db/judging-schema";

export const hackathonSettingsRouter = createTRPCRouter({
	// Get current hackathon settings
	get: publicProcedure.query(async ({ ctx }) => {
		const settings = await ctx.db.query.hackathonSettings.findFirst({
			where: eq(hackathonSettings.id, 1)
		});
		return settings ?? null;
	}),

	// Show or hide every team's scores to participants (admin only).
	setScoresReleased: adminProcedure
		.input(z.object({ released: z.boolean() }))
		.mutation(async ({ ctx, input }) => {
			if (input.released) {
				const finalRound = await ctx.db.query.judgingRounds.findFirst({
					where: eq(judgingRounds.kind, "final"),
					columns: { endTime: true }
				});
				const blocker = getScoreReleaseBlocker(finalRound?.endTime, new Date());
				if (blocker) {
					throw new TRPCError({ code: "BAD_REQUEST", message: blocker });
				}
			}

			const [updated] = await ctx.db
				.insert(hackathonSettings)
				.values({ id: 1, scoresReleased: input.released })
				.onConflictDoUpdate({
					target: hackathonSettings.id,
					set: { scoresReleased: input.released }
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
