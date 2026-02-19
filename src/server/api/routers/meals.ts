import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { meal, mealAttendance } from "@/server/db/meal-schema";

export const mealsRouter = createTRPCRouter({
	addMeal: publicProcedure
		.input(
			z
				.object({
					title: z.string(),
					startTime: z.string(),
					endTime: z.string()
				})
				.refine((data) => new Date(data.endTime) > new Date(data.startTime), {
					message: "End time must be after start time.",
					path: ["endTime"]
				})
		)
		.mutation(async ({ input, ctx }) => {
			const [newMeal] = await ctx.db
				.insert(meal)
				.values({
					title: input.title,
					startTime: new Date(input.startTime),
					endTime: new Date(input.endTime)
				})
				.returning();
			return newMeal;
		}),

	scanUserIn: publicProcedure
		.input(
			z.object({
				mealId: z.string().uuid(),
				userId: z.string(),
				checkedInBy: z.string()
			})
		)
		.mutation(async ({ input, ctx }) => {
			const [record] = await ctx.db
				.insert(mealAttendance)
				.values({
					mealId: input.mealId,
					userId: input.userId,
					checkedInBy: input.checkedInBy
				})
				.returning();
			return record;
		})
});
