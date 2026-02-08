import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { meal } from "@/server/db/meal-schema";

export const mealsRouter = createTRPCRouter({
	addMeal: protectedProcedure
		.input(
			z.object({
				title: z.string(),
				startTime: z.string().datetime(),
				endTime: z.string().datetime(),
			}),
		)
		.mutation(async ({ input, ctx }) => {
			const [newMeal] = await ctx.db
				.insert(meal)
				.values({
					title: input.title,
					startTime: new Date(input.startTime),
					endTime: new Date(input.endTime),
				})
				.returning();
			return newMeal;
		}),
});
