import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { adminProcedure, createTRPCRouter } from "@/server/api/trpc";
import { meal, mealAttendance } from "@/server/db/meal-schema";

export const mealsRouter = createTRPCRouter({
	addMeal: adminProcedure
		.input(
			z
				.object({
					title: z.string().trim().min(1),
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
				.insert(meal)
				.values({
					title: input.title,
					startTime: input.startTime,
					endTime: input.endTime
				})
				.returning();
			return newMeal;
		}),

	scanUserIn: adminProcedure
		.input(
			z.object({
				mealId: z.string(),
				userId: z.string().min(1)
			})
		)
		.mutation(async ({ input, ctx }) => {
			const [record] = await ctx.db
				.insert(mealAttendance)
				.values({
					mealId: input.mealId,
					userId: input.userId
				})
				.onConflictDoNothing({
					target: [mealAttendance.userId, mealAttendance.mealId]
				})
				.returning();

			if (!record) {
				throw new TRPCError({
					code: "CONFLICT",
					message: "User is already checked in for this meal."
				});
			}

			return record;
		}),

	getAllMeals: adminProcedure.query(async ({ ctx }) => {
		const meals = await ctx.db.select().from(meal).orderBy(meal.startTime);
		return meals;
	}),

	getMealAttendees: adminProcedure.query(async ({ ctx }) => {
		const mealAttendees = await ctx.db
			.select()
			.from(mealAttendance)
			.orderBy(mealAttendance.updatedAt);
		return mealAttendees;
	})
});
