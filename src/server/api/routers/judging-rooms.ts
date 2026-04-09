import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { adminProcedure, createTRPCRouter } from "@/server/api/trpc";
import {
	judgingAssignments,
	judgingRoomStaff,
	judgingRooms
} from "@/server/db/schema";

const RoomSchema = z.object({
	id: z.string().uuid(),
	name: z.string().min(1),
	roomLink: z.string().optional().nullable(),
	staffIds: z.array(z.string()).default([]),
	teamIds: z.array(z.string()).default([]),
	teamTimeSlots: z
		.record(z.string(), z.string().datetime().nullable())
		.default({})
});

const LayoutSchema = z.object({
	rooms: z.array(RoomSchema).default([])
});

export const judgingRoomsRouter = createTRPCRouter({
	// Get room layout for a round
	getLayoutByRound: adminProcedure
		.input(z.object({ roundId: z.string().uuid() }))
		.query(async ({ ctx, input }) => {
			const rooms = await ctx.db.query.judgingRooms.findMany({
				where: eq(judgingRooms.roundId, input.roundId),
				with: {
					assignments: true
				}
			});

			return {
				rooms: await Promise.all(
					rooms.map(async (room) => {
						const staffRows = await ctx.db.query.judgingRoomStaff.findMany({
							where: eq(judgingRoomStaff.roomId, room.id)
						});
						return {
							id: room.id,
							name: `Room ${room.id.slice(0, 8)}`,
							roomLink: room.roomLink,
							staffIds: staffRows.map((s) => s.staffId),
							teamIds: room.assignments.map((a) => a.teamId),
							teamTimeSlots: Object.fromEntries(
								room.assignments.map((a) => [
									a.teamId,
									a.timeSlot ? a.timeSlot.toISOString() : null
								])
							)
						};
					})
				)
			};
		}),

	// Save room layout for a round
	saveLayoutByRound: adminProcedure
		.input(z.object({ roundId: z.string().uuid(), layout: LayoutSchema }))
		.mutation(async ({ ctx, input }) => {
			// Replace round room layout in DB tables:
			// deleting rooms cascades existing staff + assignments for that round.
			await ctx.db
				.delete(judgingRooms)
				.where(eq(judgingRooms.roundId, input.roundId));

			for (const room of input.layout.rooms) {
				const [createdRoom] = await ctx.db
					.insert(judgingRooms)
					.values({
						roundId: input.roundId,
						roomLink: room.roomLink ?? ""
					})
					.returning();

				if (!createdRoom) continue;

				if (room.staffIds.length > 0) {
					await ctx.db.insert(judgingRoomStaff).values(
						room.staffIds.map((staffId) => ({
							roomId: createdRoom.id,
							staffId
						}))
					);
				}

				if (room.teamIds.length > 0) {
					await ctx.db.insert(judgingAssignments).values(
						room.teamIds.map((teamId) => ({
							roomId: createdRoom.id,
							teamId,
							timeSlot: (() => {
								const iso = room.teamTimeSlots?.[teamId];
								return iso ? new Date(iso) : undefined;
							})()
						}))
					);
				}
			}

			const rooms = await ctx.db.query.judgingRooms.findMany({
				where: eq(judgingRooms.roundId, input.roundId)
			});
			return { success: true, roomsCreated: rooms.length };
		}),

	// Dummy endpoint for future algorithm integration
	autoAssignStub: adminProcedure
		.input(z.object({ roundId: z.string().uuid() }))
		.mutation(async () => {
			return {
				success: false,
				message:
					"Auto-assign is not implemented yet. This will call the algorithm service in the future."
			};
		}),

	// Optional helper: apply current room layout to judgingAssignments by creating any missing (judge, team) pairs.
	// This does NOT delete existing assignments (to avoid wiping scores via cascade).
	applyLayoutToAssignments: adminProcedure
		.input(z.object({ roundId: z.string().uuid() }))
		.mutation(async ({ ctx, input }) => {
			const roomCount = await ctx.db.query.judgingRooms.findMany({
				where: eq(judgingRooms.roundId, input.roundId),
				columns: { id: true }
			});
			if (roomCount.length === 0) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "No rooms found for this round."
				});
			}
			// Layout is already persisted directly to assignments in saveLayoutByRound.
			return { created: 0 };
		})
});
