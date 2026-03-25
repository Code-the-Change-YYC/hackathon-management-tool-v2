import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { adminProcedure, createTRPCRouter } from "@/server/api/trpc";
import { user } from "@/server/db/auth-schema";
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

	getMeal: adminProcedure
		.input(z.object({ id: z.string().uuid() }))
		.query(async ({ input, ctx }) => {
			const [oneMeal] = await ctx.db
				.select()
				.from(meal)
				.where(eq(meal.id, input.id));
			return oneMeal;
		}),

	getMealAttendees: adminProcedure
		.input(z.object({ id: z.string().uuid() }))
		.query(async ({ input, ctx }) => {
			const mealAttendees = await ctx.db
				.select({
					id: mealAttendance.id,
					userId: mealAttendance.userId,
					mealId: mealAttendance.mealId,
					userName: user.name,
					createdAt: mealAttendance.createdAt,
					updatedAt: mealAttendance.updatedAt
				})
				.from(mealAttendance)
				.innerJoin(user, eq(mealAttendance.userId, user.id))
				.where(eq(mealAttendance.mealId, input.id))
				.orderBy(mealAttendance.updatedAt);
			return mealAttendees;
		})
});
