import { TRPCError } from "@trpc/server";
import { asc, eq } from "drizzle-orm";
import { z } from "zod";
import { MAIN_CRITERION_MAX_SCORE } from "@/lib/judging";
import { getParticipantCriteria } from "@/server/api/participant-judging";
import type { DbClient } from "@/server/api/routers/judging-tables";
import {
	adminProcedure,
	createTRPCRouter,
	judgeProcedure,
	publicProcedure
} from "@/server/api/trpc";
import { judgingCriteria, judgingScores } from "@/server/db/judging-schema";

// A scorecard only counts once it scores every criterion within its maximum,
// so adding, removing or rescaling one after scoring starts voids scorecards.
async function assertRubricUnlocked(db: DbClient) {
	const [score] = await db
		.select({ id: judgingScores.id })
		.from(judgingScores)
		.limit(1);
	if (score) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message:
				"Judges have started scoring, so criteria can’t be added, removed, or rescored."
		});
	}
}

export const criteriaRouter = createTRPCRouter({
	getAll: judgeProcedure.query(async ({ ctx }) => {
		return await ctx.db
			.select()
			.from(judgingCriteria)
			.orderBy(asc(judgingCriteria.displayOrder), asc(judgingCriteria.name));
	}),

	getPublic: publicProcedure.query(async ({ ctx }) => {
		return await getParticipantCriteria(ctx.db);
	}),

	create: adminProcedure
		.input(
			z.object({
				name: z.string().min(1),
				description: z.string().default(""),
				displayOrder: z.number().int().default(0),
				maxScore: z.number().int().positive().default(MAIN_CRITERION_MAX_SCORE),
				isSidepot: z.boolean().default(false)
			})
		)
		.mutation(async ({ ctx, input }) => {
			await assertRubricUnlocked(ctx.db);
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
				isSidepot: z.boolean().optional()
			})
		)
		.mutation(async ({ ctx, input }) => {
			const { id, ...data } = input;
			const existing = await ctx.db.query.judgingCriteria.findFirst({
				where: eq(judgingCriteria.id, id)
			});
			if (!existing)
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Criterion not found."
				});
			if (
				(data.maxScore !== undefined && data.maxScore !== existing.maxScore) ||
				(data.isSidepot !== undefined && data.isSidepot !== existing.isSidepot)
			) {
				await assertRubricUnlocked(ctx.db);
			}
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
			await assertRubricUnlocked(ctx.db);
			await ctx.db
				.delete(judgingCriteria)
				.where(eq(judgingCriteria.id, input.id));
			return { success: true };
		})
});
