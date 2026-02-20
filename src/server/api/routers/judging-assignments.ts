import { eq } from "drizzle-orm";
import { z } from "zod";
import {
	createTRPCRouter,
	protectedProcedure,
	publicProcedure
} from "@/server/api/trpc";
import { judgingAssignments } from "@/server/db/schema";

export const judgingAssignmentsRouter = createTRPCRouter({
	// Get all assignments
	getAll: publicProcedure.query(async ({ ctx }) => {
		const assignments = await ctx.db.query.judgingAssignments.findMany({
			with: {
				team: true,
				room: true,
				scores: true
			},
			orderBy: (assignments, { desc }) => [desc(assignments.createdAt)]
		});
		return assignments;
	}),

	// Get assignments by room ID
	getByRoom: publicProcedure
		.input(z.object({ roomId: z.string().uuid() }))
		.query(async ({ ctx, input }) => {
			const assignments = await ctx.db.query.judgingAssignments.findMany({
				where: eq(judgingAssignments.roomId, input.roomId),
				with: {
					team: true,
					room: true,
					scores: true
				}
			});
			return assignments;
		}),

	// Get assignments for a specific team
	getByTeam: publicProcedure
		.input(z.object({ teamId: z.string() }))
		.query(async ({ ctx, input }) => {
			const assignments = await ctx.db.query.judgingAssignments.findMany({
				where: eq(judgingAssignments.teamId, input.teamId),
				with: {
					room: true,
					scores: true
				}
			});
			return assignments;
		}),

	// Create a new assignment
	create: protectedProcedure
		.input(
			z.object({
				teamId: z.string(),
				roomId: z.string().uuid(),
				timeSlot: z.coerce.date().optional()
			})
		)
		.mutation(async ({ ctx, input }) => {
			const [assignment] = await ctx.db
				.insert(judgingAssignments)
				.values(input)
				.returning();
			return assignment;
		}),

	// Update an assignment
	update: protectedProcedure
		.input(
			z.object({
				id: z.string().uuid(),
				teamId: z.string().optional(),
				roomId: z.string().uuid().optional(),
				timeSlot: z.coerce.date().optional().nullable()
			})
		)
		.mutation(async ({ ctx, input }) => {
			const { id, ...data } = input;
			const [updated] = await ctx.db
				.update(judgingAssignments)
				.set(data)
				.where(eq(judgingAssignments.id, id))
				.returning();
			return updated;
		}),

	// Delete an assignment
	delete: protectedProcedure
		.input(z.object({ id: z.string().uuid() }))
		.mutation(async ({ ctx, input }) => {
			await ctx.db
				.delete(judgingAssignments)
				.where(eq(judgingAssignments.id, input.id));
			return { success: true };
		})
});
