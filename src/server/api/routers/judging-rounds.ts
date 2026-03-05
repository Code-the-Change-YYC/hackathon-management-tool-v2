import { eq } from "drizzle-orm";
import { z } from "zod";
import { createSchedule } from "@/app/admin/scheduler";
import { TRPCError } from "@trpc/server";
import {
	createTRPCRouter,
	protectedProcedure,
	adminProcedure,
	publicProcedure
} from "@/server/api/trpc";
import { judgingAssignments, judgingRounds } from "@/server/db/schema";
import { user } from "@/server/db/auth-schema";

export const judgingRoundsRouter = createTRPCRouter({
	getAll: publicProcedure.query(async ({ ctx }) => {
		const rounds = await ctx.db.query.judgingRounds.findMany({
			orderBy: (rounds, { desc }) => [desc(rounds.startTime)]
		});
		return rounds;
	}),

	generateSchedule: adminProcedure
		.input(
			z.object({
				roundId: z.string().uuid(),
				durationMinutes: z.number().min(1),
				bufferMinutes: z.number().min(0).default(5)
			})
		)
		.mutation(async ({ ctx, input }) => {
			try {
				const round = await ctx.db.query.judgingRounds.findFirst({
					where: eq(judgingRounds.id, input.roundId)
				});

				if (!round) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Round not found"
					});
				}

				const teams = await ctx.db.query.organization.findMany();

				if (teams.length === 0) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "No teams found. Make sure teams are registered."
					});
				}

				const judges = await ctx.db.query.user.findMany({
					where: eq(user.role, "judge")
				});

				if (judges.length === 0) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message:
							"No judges found. Assign judge roles before generating a schedule."
					});
				}

				const schedule = createSchedule(
					teams,
					judges,
					round.startTime,
					input.durationMinutes,
					input.bufferMinutes
				);

				const lastSlot = schedule[schedule.length - 1];
				if (lastSlot) {
					const lastSlotEnd = new Date(
						lastSlot.start.getTime() + input.durationMinutes * 60000
					);
					if (lastSlotEnd > round.endTime) {
						throw new TRPCError({
							code: "BAD_REQUEST",
							message: `Schedule ends at ${lastSlotEnd.toISOString()} which exceeds the round end time. Try reducing duration or buffer.`
						});
					}
				}

				await ctx.db
					.delete(judgingAssignments)
					.where(eq(judgingAssignments.roundId, input.roundId));

				await ctx.db.insert(judgingAssignments).values(
					schedule.map((slot) => ({
						judgeId: slot.judgeId,
						teamId: slot.teamId,
						roundId: round.id,
						timeSlot: slot.start
					}))
				);

				return { success: true, assignmentsCreated: schedule.length };
			} catch (error) {
				if (error instanceof TRPCError) throw error;
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to generate schedule. Please try again.",
					cause: error
				});
			}
		}),

	// Get a single judging round by ID
	getById: publicProcedure
		.input(z.object({ id: z.string().uuid() }))
		.query(async ({ ctx, input }) => {
			const round = await ctx.db.query.judgingRounds.findFirst({
				where: eq(judgingRounds.id, input.id),
				with: {
					assignments: true
				}
			});
			return round;
		}),

	// Create a new judging round
	create: protectedProcedure
		.input(
			z.object({
				name: z.string().min(1),
				startTime: z.date(),
				endTime: z.date()
			})
		)
		.mutation(async ({ ctx, input }) => {
			const [round] = await ctx.db
				.insert(judgingRounds)
				.values(input)
				.returning();
			return round;
		}),

	// Update a judging round
	update: protectedProcedure
		.input(
			z.object({
				id: z.string().uuid(),
				name: z.string().min(1).optional(),
				startTime: z.date().optional(),
				endTime: z.date().optional()
			})
		)
		.mutation(async ({ ctx, input }) => {
			const { id, ...data } = input;
			const [updated] = await ctx.db
				.update(judgingRounds)
				.set(data)
				.where(eq(judgingRounds.id, id))
				.returning();
			return updated;
		}),

	// Delete a judging round
	delete: protectedProcedure
		.input(z.object({ id: z.string().uuid() }))
		.mutation(async ({ ctx, input }) => {
			await ctx.db.delete(judgingRounds).where(eq(judgingRounds.id, input.id));
			return { success: true };
		})
});
