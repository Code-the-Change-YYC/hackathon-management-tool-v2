import { TRPCError } from "@trpc/server";
import { asc, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { MAIN_CRITERION_MAX_SCORE } from "@/lib/judging";
import {
	adminProcedure,
	createTRPCRouter,
	publicProcedure
} from "@/server/api/trpc";
import type { db } from "@/server/db";
import { judgingCriteria, judgingRounds } from "@/server/db/judging-schema";

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
			.from(judgingCriteria)
			.orderBy(asc(judgingCriteria.displayOrder), asc(judgingCriteria.name));
	}),

	create: adminProcedure
		.input(
			z.object({
				name: z.string().min(1),
				description: z.string().default(""),
				displayOrder: z.number().int().default(0),
				maxScore: z.number().int().positive().default(MAIN_CRITERION_MAX_SCORE),
				roundIds: z.array(z.string().uuid()).default([]),
				isSidepot: z.boolean().default(false)
			})
		)
		.mutation(async ({ ctx, input }) => {
			await validateRounds(ctx.db, input.roundIds);
			if (!input.isSidepot && input.maxScore !== MAIN_CRITERION_MAX_SCORE) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: `Main criteria must have a maximum score of ${MAIN_CRITERION_MAX_SCORE}.`
				});
			}
			return await ctx.db.insert(judgingCriteria).values(input).returning();
		}),

	update: adminProcedure
		.input(
			z.object({
				id: z.string().uuid(),
				name: z.string().min(1).optional(),
				description: z.string().optional(),
				displayOrder: z.number().int().optional(),
				maxScore: z.number().int().positive().optional(),
				roundIds: z.array(z.string().uuid()).optional(),
				isSidepot: z.boolean().optional()
			})
		)
		.mutation(async ({ ctx, input }) => {
			const { id, ...data } = input;
			await validateRounds(ctx.db, data.roundIds);
			const existing = await ctx.db.query.judgingCriteria.findFirst({
				where: eq(judgingCriteria.id, id)
			});
			if (!existing)
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Criterion not found."
				});
			if (
				!(data.isSidepot ?? existing.isSidepot) &&
				(data.maxScore ?? existing.maxScore) !== MAIN_CRITERION_MAX_SCORE
			) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: `Main criteria must have a maximum score of ${MAIN_CRITERION_MAX_SCORE}.`
				});
			}
			const [updated] = await ctx.db
				.update(judgingCriteria)
				.set(data)
				.where(eq(judgingCriteria.id, id))
				.returning();
			return updated;
		}),

	delete: adminProcedure
		.input(z.object({ id: z.string().uuid() }))
		.mutation(async ({ ctx, input }) => {
			await ctx.db
				.delete(judgingCriteria)
				.where(eq(judgingCriteria.id, input.id));
			return { success: true };
		})
});
