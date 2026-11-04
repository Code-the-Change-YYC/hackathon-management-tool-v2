import { TRPCError } from "@trpc/server";
import { and, asc, eq, gt } from "drizzle-orm";
import { z } from "zod";
import {
	DIETARY_RESTRICTIONS,
	toDietaryRestrictions
} from "@/lib/validation/signup";
import {
	adminProcedure,
	createTRPCRouter,
	protectedProcedure
} from "@/server/api/trpc";
import { user } from "@/server/db/auth-schema";
import { event, eventAttendance } from "@/server/db/event-schema";
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

	getAttendanceAnalytics: adminProcedure.query(async ({ ctx }) => {
		const [meals, attendances] = await Promise.all([
			ctx.db.query.event.findMany({
				columns: { id: true, title: true, startTime: true },
				where: eq(event.type, EventType.FOOD),
				orderBy: [asc(event.startTime)]
			}),
			ctx.db
				.select({
					eventId: eventAttendance.eventId,
					userId: eventAttendance.userId,
					dietaryRestrictions: user.dietaryRestrictions
				})
				.from(eventAttendance)
				.innerJoin(event, eq(eventAttendance.eventId, event.id))
				.innerJoin(user, eq(eventAttendance.userId, user.id))
				.where(eq(event.type, EventType.FOOD))
		]);

		const emptyCounts = () =>
			Object.fromEntries(
				DIETARY_RESTRICTIONS.map((restriction) => [restriction, 0])
			) as Record<(typeof DIETARY_RESTRICTIONS)[number], number>;
		const summary = meals.map((meal) => ({
			...meal,
			scans: 0,
			restrictions: emptyCounts()
		}));
		const byId = new Map(summary.map((meal) => [meal.id, meal]));
		const uniqueAttendees = new Map<
			string,
			ReturnType<typeof toDietaryRestrictions>
		>();

		for (const attendance of attendances) {
			const meal = byId.get(attendance.eventId);
			if (!meal) continue;
			meal.scans += 1;
			const restrictions = toDietaryRestrictions(
				attendance.dietaryRestrictions
			);
			for (const restriction of restrictions)
				meal.restrictions[restriction] += 1;
			uniqueAttendees.set(attendance.userId, restrictions);
		}

		const overallRestrictions = emptyCounts();
		for (const restrictions of uniqueAttendees.values()) {
			for (const restriction of restrictions)
				overallRestrictions[restriction] += 1;
		}

		return {
			overall: {
				scans: attendances.length,
				uniqueAttendees: uniqueAttendees.size,
				restrictions: overallRestrictions
			},
			meals: summary
		};
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
