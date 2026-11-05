import { TRPCError } from "@trpc/server";
import { and, asc, desc, eq, gt } from "drizzle-orm";
import { z } from "zod";
import {
	adminProcedure,
	createTRPCRouter,
	protectedProcedure
} from "@/server/api/trpc";
import { event, eventAttendance } from "@/server/db/event-schema";
import { createMealScannerLease } from "@/server/lib/event-tickets";
import { EventStatus, EventType } from "@/types/types";

export const mealsRouter = createTRPCRouter({
	getMealCheckIns: adminProcedure.query(async ({ ctx }) => {
		return ctx.db.query.event.findMany({
			where: eq(event.type, EventType.FOOD),
			orderBy: [asc(event.startTime)],
			with: {
				attendance: {
					columns: { id: true, createdAt: true },
					orderBy: [desc(eventAttendance.createdAt), desc(eventAttendance.id)],
					with: {
						user: {
							columns: { id: true, name: true, dietaryRestrictions: true }
						}
					}
				}
			}
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
		const nextMeal = await ctx.db.query.event.findFirst({
			where: and(
				eq(event.type, EventType.FOOD),
				eq(event.status, EventStatus.ACTIVE),
				gt(event.endTime, new Date())
			),
			orderBy: [asc(event.startTime)]
		});

		return nextMeal ?? null;
	}),

	beginMealScan: adminProcedure
		.input(z.object({ eventId: z.string().uuid() }))
		.mutation(async ({ input, ctx }) => {
			const meal = await ctx.db.query.event.findFirst({
				where: and(
					eq(event.id, input.eventId),
					eq(event.type, EventType.FOOD),
					eq(event.status, EventStatus.ACTIVE),
					gt(event.endTime, new Date())
				)
			});
			if (!meal) {
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
					meal.endTime
				)
			};
		})
});
