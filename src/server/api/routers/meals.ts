import { and, eq, gte } from "drizzle-orm";
import { z } from "zod";
import {
	adminProcedure,
	createTRPCRouter,
	protectedProcedure
} from "@/server/api/trpc";
import { event } from "@/server/db/event-schema";
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
		return ctx.db
			.select()
			.from(event)
			.where(eq(event.type, EventType.FOOD))
			.orderBy(event.startTime);
	}),

	getActiveMeals: protectedProcedure.query(async ({ ctx }) => {
		return ctx.db
			.select()
			.from(event)
			.where(
				and(
					eq(event.type, EventType.FOOD),
					eq(event.status, EventStatus.ACTIVE)
				)
			)
			.orderBy(event.startTime);
	}),

	getNextMeal: protectedProcedure.query(async ({ ctx }) => {
		const [nextMeal] = await ctx.db
			.select()
			.from(event)
			.where(
				and(
					eq(event.type, EventType.FOOD),
					eq(event.status, EventStatus.ACTIVE),
					gte(event.endTime, new Date())
				)
			)
			.orderBy(event.startTime)
			.limit(1);

		return nextMeal ?? null;
	}),

	getMeal: adminProcedure
		.input(z.object({ id: z.string().uuid() }))
		.query(async ({ input, ctx }) => {
			const [oneMeal] = await ctx.db
				.select()
				.from(event)
				.where(and(eq(event.id, input.id), eq(event.type, EventType.FOOD)));
			return oneMeal ?? null;
		})
});
