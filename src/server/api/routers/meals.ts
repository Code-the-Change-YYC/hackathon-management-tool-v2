import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { meal, mealAttendance } from "@/server/db/meal-schema";

export const mealsRouter = createTRPCRouter({
	addMeal: publicProcedure
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

	scanUserIn: publicProcedure
		.input(
			z.object({
				mealId: z.string().uuid(),
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
		})
});
