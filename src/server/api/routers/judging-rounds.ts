import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getFinalRoundEndTime, MAX_PRESENTATION_MINUTES } from "@/lib/judging";
import { scheduleFinalists } from "@/server/api/final-round";
import { assertRoundHasNoScores } from "@/server/api/routers/judging-tables";
import {
	adminProcedure,
	createTRPCRouter,
	protectedProcedure
} from "@/server/api/trpc";
import { judgingRounds, judgingTables } from "@/server/db/judging-schema";

export const judgingRoundsRouter = createTRPCRouter({
	// Get all judging rounds
	getAll: protectedProcedure.query(async ({ ctx }) => {
		const rounds = await ctx.db.query.judgingRounds.findMany({
			orderBy: (rounds, { desc }) => [desc(rounds.startTime)]
		});
		return rounds;
	}),

	// A panel round sets a window for its schedule. There is at most one final
	// round, and its finalists come from judgingResults.setFinalists.
	create: adminProcedure
		.input(
			z
				.discriminatedUnion("kind", [
					z.object({
						kind: z.literal("panel"),
						name: z.string().min(1),
						startTime: z.coerce.date(),
						endTime: z.coerce.date()
					}),
					z.object({
						kind: z.literal("final"),
						name: z.string().min(1),
						startTime: z.coerce.date(),
						presentationMinutes: z.number().int().min(1),
						changeoverMinutes: z.number().int().min(0)
					})
				])
				.refine(
					(data) => data.kind === "final" || data.endTime > data.startTime,
					{ message: "End time must be after start time.", path: ["endTime"] }
				)
		)
		.mutation(async ({ ctx, input }) => {
			if (input.kind === "panel") {
				const [round] = await ctx.db
					.insert(judgingRounds)
					.values(input)
					.returning();
				return round;
			}
			const existing = await ctx.db.query.judgingRounds.findFirst({
				where: eq(judgingRounds.kind, "final"),
				columns: { id: true }
			});
			if (existing) {
				throw new TRPCError({
					code: "CONFLICT",
					message: "There's already a final round."
				});
			}
			const [round] = await ctx.db
				.insert(judgingRounds)
				.values({
					...input,
					endTime: getFinalRoundEndTime({ ...input, finalistCount: 0 })
				})
				.returning();
			return round;
		}),

	// A final round's end follows its finalists, who move with its start.
	update: adminProcedure
		.input(
			z.object({
				id: z.string().uuid(),
				name: z.string().min(1).optional(),
				startTime: z.coerce.date().optional(),
				endTime: z.coerce.date().optional(),
				presentationMinutes: z.number().int().min(1).optional(),
				changeoverMinutes: z.number().int().min(0).optional()
			})
		)
		.mutation(async ({ ctx, input }) => {
			const { id, name, startTime, endTime } = input;

			await assertRoundHasNoScores(ctx.db, id);

			const existingRound = await ctx.db.query.judgingRounds.findFirst({
				where: eq(judgingRounds.id, id),
				with: { tables: { with: { assignments: true } } }
			});
			if (!existingRound) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Round not found."
				});
			}

			if (existingRound.kind === "panel") {
				const nextStartTime = startTime ?? existingRound.startTime;
				const nextEndTime = endTime ?? existingRound.endTime;
				if (nextEndTime <= nextStartTime) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "End time must be after start time."
					});
				}
				const [updated] = await ctx.db
					.update(judgingRounds)
					.set({ name, startTime, endTime })
					.where(eq(judgingRounds.id, id))
					.returning();
				return updated;
			}

			const timing = {
				startTime: startTime ?? existingRound.startTime,
				presentationMinutes:
					input.presentationMinutes ??
					existingRound.presentationMinutes ??
					MAX_PRESENTATION_MINUTES,
				changeoverMinutes:
					input.changeoverMinutes ?? existingRound.changeoverMinutes
			};
			const table = existingRound.tables[0];
			const teamIds = (table?.assignments ?? [])
				.slice()
				.sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime())
				.map((assignment) => assignment.teamId);
			return ctx.db.transaction(async (tx) => {
				if (table) await scheduleFinalists(tx, table.id, teamIds, timing);
				const [updated] = await tx
					.update(judgingRounds)
					.set({
						name,
						...timing,
						endTime: getFinalRoundEndTime({
							...timing,
							finalistCount: teamIds.length
						})
					})
					.where(eq(judgingRounds.id, id))
					.returning();
				return updated;
			});
		}),

	// Participants only see a round's schedule once it is published
	publish: adminProcedure
		.input(z.object({ id: z.string().uuid() }))
		.mutation(async ({ ctx, input }) => {
			const table = await ctx.db.query.judgingTables.findFirst({
				where: eq(judgingTables.roundId, input.id),
				columns: { id: true }
			});
			if (!table) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Generate a schedule before publishing this round."
				});
			}
			const [updated] = await ctx.db
				.update(judgingRounds)
				.set({ publishedAt: new Date() })
				.where(eq(judgingRounds.id, input.id))
				.returning();
			return updated;
		}),

	unpublish: adminProcedure
		.input(z.object({ id: z.string().uuid() }))
		.mutation(async ({ ctx, input }) => {
			const [updated] = await ctx.db
				.update(judgingRounds)
				.set({ publishedAt: null })
				.where(eq(judgingRounds.id, input.id))
				.returning();
			return updated;
		}),

	// Delete a judging round
	delete: adminProcedure
		.input(z.object({ id: z.string().uuid() }))
		.mutation(async ({ ctx, input }) => {
			await assertRoundHasNoScores(ctx.db, input.id);
			await ctx.db.delete(judgingRounds).where(eq(judgingRounds.id, input.id));
			return { success: true };
		})
});
