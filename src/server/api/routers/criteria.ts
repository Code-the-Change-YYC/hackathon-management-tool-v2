import { TRPCError } from "@trpc/server";
import { asc, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import {
	adminProcedure,
	createTRPCRouter,
	publicProcedure
} from "@/server/api/trpc";
import type { db } from "@/server/db";
import { judgingRounds } from "@/server/db/schema";
import { criteria } from "@/server/db/scores-schema";

async function validateRounds(database: typeof db, roundIds?: string[]) {
	if (!roundIds?.length) return;
	const ids = [...new Set(roundIds)];
	const rounds = await database.query.judgingRounds.findMany({
		where: inArray(judgingRounds.id, ids),
		columns: { id: true }
	});
	if (rounds.length !== ids.length)
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "One or more judging rounds were not found."
		});
}

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
				maxScore: z.number().int().default(10),
				roundIds: z.array(z.string().uuid()).default([]),
				isSidepot: z.boolean().default(false)
			})
		)
		.mutation(async ({ ctx, input }) => {
			await validateRounds(ctx.db, input.roundIds);
			return await ctx.db.insert(criteria).values(input).returning();
		}),

	update: adminProcedure
		.input(
			z.object({
				id: z.string().uuid(),
				name: z.string().min(1).optional(),
				description: z.string().optional(),
				displayOrder: z.number().int().optional(),
				maxScore: z.number().optional(),
				roundIds: z.array(z.string().uuid()).optional(),
				isSidepot: z.boolean().optional()
			})
		)
		.mutation(async ({ ctx, input }) => {
			const { id, ...data } = input;
			await validateRounds(ctx.db, data.roundIds);
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
