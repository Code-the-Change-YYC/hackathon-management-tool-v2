import { TRPCError } from "@trpc/server";
import { and, asc, eq, gt } from "drizzle-orm";
import { z } from "zod";
import {
	adminProcedure,
	createTRPCRouter,
	protectedProcedure
} from "@/server/api/trpc";
import { event } from "@/server/db/event-schema";
import { createMealScannerLease } from "@/server/lib/event-tickets";
import { EventStatus, EventType } from "@/types/types";

export const mealsRouter = createTRPCRouter({
	addMeal: adminProcedure
		.input(
			z
				.object({
					title: z.string().trim().min(1),
					description: z.string().trim().min(1),
					startTime: z.coerce.date(),
					endTime: z.coerce.date()
				})
				.refine((data) => data.endTime > data.startTime, {
					message: "End time must be after start time.",
					path: ["endTime"]
				})
		)
		.mutation(async ({ input, ctx }) => {
			const [newMeal] = await ctx.db
				.insert(event)
				.values({
					title: input.title,
					description: input.description,
					type: EventType.FOOD,
					status: EventStatus.DRAFT,
					startTime: input.startTime,
					endTime: input.endTime
				})
				.returning();
			return newMeal;
		}),

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
		}),

	getMeal: adminProcedure
		.input(z.object({ id: z.string().uuid() }))
		.query(async ({ input, ctx }) => {
			return ctx.db.query.event.findFirst({
				where: and(eq(event.id, input.id), eq(event.type, EventType.FOOD))
			});
		})
});
