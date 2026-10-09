import { TRPCError } from "@trpc/server";
import { asc, eq } from "drizzle-orm";
import { z } from "zod";
import {
	adminProcedure,
	createTRPCRouter,
	publicProcedure
} from "@/server/api/trpc";
import { criteria } from "@/server/db/scores-schema";

export const criteriaRouter = createTRPCRouter({
	getAll: publicProcedure.query(async ({ ctx }) => {
		return await ctx.db
			.select()
			.from(criteria)
			.orderBy(asc(criteria.displayOrder), asc(criteria.name));
	}),

	create: adminProcedure
		.input(
			z.object({
				name: z.string().min(1),
				description: z.string().default(""),
				displayOrder: z.number().int().default(0),
				maxScore: z.number().int().positive().default(10),
				isSidepot: z.boolean().default(false)
			})
		)
		.mutation(async ({ ctx, input }) => {
			if (!input.isSidepot && input.maxScore !== 10) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Main criteria must have a maximum score of 10."
				});
			}
			return await ctx.db.insert(criteria).values(input).returning();
		}),

	update: adminProcedure
		.input(
			z.object({
				id: z.string().uuid(),
				name: z.string().min(1).optional(),
				description: z.string().optional(),
				displayOrder: z.number().int().optional(),
				maxScore: z.number().int().positive().optional(),
				isSidepot: z.boolean().optional()
			})
		)
		.mutation(async ({ ctx, input }) => {
			const { id, ...data } = input;
			const existing = await ctx.db.query.criteria.findFirst({
				where: eq(criteria.id, id)
			});
			if (!existing)
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Criterion not found."
				});
			if (
				!(data.isSidepot ?? existing.isSidepot) &&
				(data.maxScore ?? existing.maxScore) !== 10
			) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Main criteria must have a maximum score of 10."
				});
			}
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
