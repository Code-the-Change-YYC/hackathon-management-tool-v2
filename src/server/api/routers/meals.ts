import { TRPCError } from "@trpc/server";
import { and, asc, eq } from "drizzle-orm";
import { z } from "zod";
import {
	adminProcedure,
	createTRPCRouter,
	protectedProcedure
} from "@/server/api/trpc";
import { event } from "@/server/db/event-schema";
import {
	createMealScannerLease,
	mealAvailabilityEnd
} from "@/server/lib/event-tickets";
import { EventStatus, EventType } from "@/types/types";

export const mealsRouter = createTRPCRouter({
	getAllMeals: adminProcedure.query(async ({ ctx }) => {
		return ctx.db.query.event.findMany({
			where: eq(event.type, EventType.FOOD),
			orderBy: [asc(event.startTime)]
		});
	}),

	getActiveMeals: protectedProcedure.query(async ({ ctx }) => {
		return ctx.db.query.event.findMany({
			where: and(
				eq(event.type, EventType.FOOD),
				eq(event.status, EventStatus.ACTIVE)
			),
			orderBy: [asc(event.startTime)]
		});
	}),

	getNextMeal: protectedProcedure.query(async ({ ctx }) => {
		const meals = await ctx.db.query.event.findMany({
			where: and(
				eq(event.type, EventType.FOOD),
				eq(event.status, EventStatus.ACTIVE)
			),
			orderBy: [asc(event.startTime), asc(event.id)]
		});
		const now = new Date();
		return meals.find((meal) => mealAvailabilityEnd(meal) > now) ?? null;
	}),

	beginMealScan: adminProcedure
		.input(z.object({ eventId: z.string().uuid() }))
		.mutation(async ({ input, ctx }) => {
			const meal = await ctx.db.query.event.findFirst({
				where: and(
					eq(event.id, input.eventId),
					eq(event.type, EventType.FOOD),
					eq(event.status, EventStatus.ACTIVE)
				)
			});
			const availableUntil = meal ? mealAvailabilityEnd(meal) : null;
			if (!meal || !availableUntil || availableUntil <= new Date()) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message:
						"This meal is no longer available to scan. Try opening the scanner again."
				});
			}
			return {
				lease: createMealScannerLease(
					meal.id,
					ctx.session.user.id,
					availableUntil
				)
			};
		})
});
