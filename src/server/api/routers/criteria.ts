import { eq } from "drizzle-orm";
import { z } from "zod";
import {
	adminProcedure,
	createTRPCRouter,
	publicProcedure
} from "@/server/api/trpc";
import { criteria } from "@/server/db/scores-schema";

export const criteriaRouter = createTRPCRouter({
	getAll: publicProcedure.query(async ({ ctx }) => {
		return await ctx.db.query.criteria.findMany();
	}),

	create: adminProcedure
		.input(
			z.object({
				name: z.string().min(1),
				maxScore: z.number().int().default(10),
				isSidepot: z.boolean().default(false)
			})
		)
		.mutation(async ({ ctx, input }) => {
			return await ctx.db.insert(criteria).values(input).returning();
		}),

	update: adminProcedure
		.input(
			z.object({
				id: z.string().uuid(),
				name: z.string().min(1).optional(),
				maxScore: z.number().optional(),
				isSidepot: z.boolean().optional()
			})
		)
		.mutation(async ({ ctx, input }) => {
			const { id, ...data } = input;
			const [updated] = await ctx.db
				.update(criteria)
				.set(data)
				.where(eq(criteria.id, id))
				.returning();
			return updated;
		}),

	delete: adminProcedure
		.input(z.object({ id: z.string().uuid() }))
		.mutation(async ({ ctx, input }) => {
			await ctx.db.delete(criteria).where(eq(criteria.id, input.id));
			return { success: true };
		})
});
