import { eq } from "drizzle-orm";
import { z } from "zod";
import {
	adminProcedure,
	createTRPCRouter,
	publicProcedure,
} from "@/server/api/trpc";
import { sidepots } from "@/server/db/scores-schema";

export const sidepotsRouter = createTRPCRouter({
	getAll: publicProcedure.query(({ ctx }) => ctx.db.query.sidepots.findMany()),

	create: adminProcedure
		.input(
			z.object({ name: z.string().min(1), description: z.string().optional() }),
		)
		.mutation(async ({ ctx, input }) => {
			const [newSidepot] = await ctx.db
				.insert(sidepots)
				.values(input)
				.returning();
			return newSidepot;
		}),

	update: adminProcedure
		.input(
			z.object({
				id: z.string().uuid(),
				name: z.string().min(1).optional(),
				description: z.string().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const { id, ...data } = input;
			const [updated] = await ctx.db
				.update(sidepots)
				.set(data)
				.where(eq(sidepots.id, id))
				.returning();
			return updated;
		}),

	delete: adminProcedure
		.input(z.object({ id: z.string().uuid() }))
		.mutation(async ({ ctx, input }) => {
			await ctx.db.delete(sidepots).where(eq(sidepots.id, input.id));
			return { success: true };
		}),
});
