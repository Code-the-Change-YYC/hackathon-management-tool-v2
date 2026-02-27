import { eq } from "drizzle-orm";
import { z } from "zod";
import {
	createTRPCRouter,
	protectedProcedure,
	publicProcedure
} from "@/server/api/trpc";
import { judgingRooms } from "@/server/db/schema";

export const judgingRoomsRouter = createTRPCRouter({
	// Get all rooms
	getAll: publicProcedure.query(async ({ ctx }) => {
		const rooms = await ctx.db.query.judgingRooms.findMany({
			with: {
				staff: true
			},
			orderBy: (rooms, { desc }) => [desc(rooms.createdAt)]
		});
		return rooms;
	}),

	// Get rooms by round ID
	getByRound: publicProcedure
		.input(z.object({ roundId: z.string().uuid() }))
		.query(async ({ ctx, input }) => {
			const rooms = await ctx.db.query.judgingRooms.findMany({
				where: eq(judgingRooms.roundId, input.roundId),
				with: {
					staff: true
				}
			});
			return rooms;
		}),

	// Create a new room
	create: protectedProcedure
		.input(
			z.object({
				roundId: z.string().uuid(),
				roomLink: z.string().min(1)
			})
		)
		.mutation(async ({ ctx, input }) => {
			const [room] = await ctx.db
				.insert(judgingRooms)
				.values(input)
				.returning();
			return room;
		}),

	// Update a room
	update: protectedProcedure
		.input(
			z.object({
				id: z.string().uuid(),
				roundId: z.string().uuid().optional(),
				roomLink: z.string().min(1).optional()
			})
		)
		.mutation(async ({ ctx, input }) => {
			const { id, ...data } = input;
			const [updated] = await ctx.db
				.update(judgingRooms)
				.set(data)
				.where(eq(judgingRooms.id, id))
				.returning();
			return updated;
		}),

	// Delete a room
	delete: protectedProcedure
		.input(z.object({ id: z.string().uuid() }))
		.mutation(async ({ ctx, input }) => {
			await ctx.db.delete(judgingRooms).where(eq(judgingRooms.id, input.id));
			return { success: true };
		})
});
