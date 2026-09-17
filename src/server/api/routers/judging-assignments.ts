import { TRPCError } from "@trpc/server";
import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import {
	getRoomDisplayNames,
	withRoomDisplayName
} from "@/server/api/routers/judging-rooms";
import {
	adminProcedure,
	createTRPCRouter,
	protectedProcedure
} from "@/server/api/trpc";
import { member, organization } from "@/server/db/auth-schema";
import {
	hackathonSettings,
	judgingAssignments,
	judgingRoomStaff,
	judgingRooms
} from "@/server/db/schema";

async function attachRoomNames<T extends { room: { id: string } }>(
	db: Parameters<typeof getRoomDisplayNames>[0],
	assignments: T[]
) {
	const names = await getRoomDisplayNames(
		db,
		assignments.map((assignment) => assignment.room.id)
	);
	return assignments.map((assignment) => ({
		...assignment,
		room: withRoomDisplayName(assignment.room, names)
	}));
}

export const judgingAssignmentsRouter = createTRPCRouter({
	// Get all assignments
	getAll: adminProcedure.query(async ({ ctx }) => {
		const assignments = await ctx.db.query.judgingAssignments.findMany({
			with: {
				team: true,
				room: {
					with: {
						round: true,
						staff: {
							with: {
								staff: true
							}
						}
					}
				},
				scores: true
			},
			orderBy: (rows, { desc }) => [desc(rows.createdAt)]
		});
		return attachRoomNames(ctx.db, assignments);
	}),

	// Get assignments by room ID
	getByRoom: adminProcedure
		.input(z.object({ roomId: z.string().uuid() }))
		.query(async ({ ctx, input }) => {
			const assignments = await ctx.db.query.judgingAssignments.findMany({
				where: eq(judgingAssignments.roomId, input.roomId),
				with: {
					team: true,
					room: {
						with: {
							round: true,
							staff: {
								with: {
									staff: true
								}
							}
						}
					},
					scores: true
				}
			});
			return attachRoomNames(ctx.db, assignments);
		}),

	// Get assignments by round ID
	getByRound: adminProcedure
		.input(z.object({ roundId: z.string().uuid() }))
		.query(async ({ ctx, input }) => {
			const roundRooms = await ctx.db
				.select({ id: judgingRooms.id })
				.from(judgingRooms)
				.where(eq(judgingRooms.roundId, input.roundId));
			const roomIds = roundRooms.map((room) => room.id);
			if (roomIds.length === 0) return [];

			const assignments = await ctx.db.query.judgingAssignments.findMany({
				where: inArray(judgingAssignments.roomId, roomIds),
				with: {
					team: true,
					room: {
						with: {
							round: true,
							staff: {
								with: {
									staff: true
								}
							}
						}
					},
					scores: true
				},
				orderBy: (rows, { asc }) => [asc(rows.timeSlot)]
			});
			return attachRoomNames(ctx.db, assignments);
		}),

	// Get assignments for a specific room staff user
	getByJudge: protectedProcedure
		.input(z.object({ judgeId: z.string() }))
		.query(async ({ ctx, input }) => {
			if (
				ctx.session.user.role !== "admin" &&
				input.judgeId !== ctx.session.user.id
			) {
				throw new TRPCError({ code: "FORBIDDEN" });
			}

			const roomStaffRows = await ctx.db.query.judgingRoomStaff.findMany({
				where: eq(judgingRoomStaff.staffId, input.judgeId),
				columns: { roomId: true }
			});
			const roomIds = roomStaffRows.map((r) => r.roomId);
			if (roomIds.length === 0) return [];

			const assignments = await ctx.db.query.judgingAssignments.findMany({
				where: inArray(judgingAssignments.roomId, roomIds),
				with: {
					team: true,
					room: {
						with: {
							round: true
						}
					},
					scores: true
				},
				orderBy: (assignments, { asc }) => [asc(assignments.timeSlot)]
			});
			return attachRoomNames(ctx.db, assignments);
		}),

	// Get assignments for a specific team
	getByTeam: adminProcedure
		.input(z.object({ teamId: z.string() }))
		.query(async ({ ctx, input }) => {
			const assignments = await ctx.db.query.judgingAssignments.findMany({
				where: eq(judgingAssignments.teamId, input.teamId),
				with: {
					room: {
						with: {
							round: true
						}
					},
					scores: true
				}
			});
			return attachRoomNames(ctx.db, assignments);
		}),

	getMineForActiveRound: protectedProcedure.query(async ({ ctx }) => {
		const settings = await ctx.db.query.hackathonSettings.findFirst({
			where: eq(hackathonSettings.id, 1)
		});
		if (!settings?.currentRoundId) return null;

		const membership = await ctx.db.query.member.findFirst({
			where: eq(member.userId, ctx.session.user.id)
		});
		if (!membership) return null;

		const roundRooms = await ctx.db
			.select({ id: judgingRooms.id })
			.from(judgingRooms)
			.where(eq(judgingRooms.roundId, settings.currentRoundId));
		const roomIds = roundRooms.map((room) => room.id);
		if (roomIds.length === 0) return null;

		const assignment = await ctx.db.query.judgingAssignments.findFirst({
			where: and(
				eq(judgingAssignments.teamId, membership.organizationId),
				inArray(judgingAssignments.roomId, roomIds)
			),
			with: {
				team: true,
				room: {
					with: {
						round: true
					}
				}
			},
			orderBy: (rows, { asc: orderAsc }) => [orderAsc(rows.timeSlot)]
		});

		if (!assignment) return null;
		const [named] = await attachRoomNames(ctx.db, [assignment]);
		return named ?? null;
	}),

	// Create a new assignment
	create: adminProcedure
		.input(
			z.object({
				teamId: z.string(),
				roomId: z.string().uuid(),
				timeSlot: z.date().optional()
			})
		)
		.mutation(async ({ ctx, input }) => {
			const team = await ctx.db.query.organization.findFirst({
				where: eq(organization.id, input.teamId)
			});
			if (!team) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Team not found"
				});
			}
			if (team.prescreenStatus !== "passed") {
				throw new TRPCError({
					code: "CONFLICT",
					message:
						"Only prescreen-passed teams can be assigned to judging rooms"
				});
			}

			const [assignment] = await ctx.db
				.insert(judgingAssignments)
				.values(input)
				.returning();
			return assignment;
		}),

	// Update an assignment
	update: adminProcedure
		.input(
			z.object({
				id: z.string().uuid(),
				teamId: z.string().optional(),
				roomId: z.string().uuid().optional(),
				timeSlot: z.date().optional().nullable()
			})
		)
		.mutation(async ({ ctx, input }) => {
			const { id, ...data } = input;

			if (data.teamId) {
				const team = await ctx.db.query.organization.findFirst({
					where: eq(organization.id, data.teamId)
				});
				if (!team) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Team not found"
					});
				}
				if (team.prescreenStatus !== "passed") {
					throw new TRPCError({
						code: "CONFLICT",
						message:
							"Only prescreen-passed teams can be assigned to judging rooms"
					});
				}
			}

			const [updated] = await ctx.db
				.update(judgingAssignments)
				.set(data)
				.where(eq(judgingAssignments.id, id))
				.returning();
			return updated;
		}),

	// Delete an assignment
	delete: adminProcedure
		.input(z.object({ id: z.string().uuid() }))
		.mutation(async ({ ctx, input }) => {
			await ctx.db
				.delete(judgingAssignments)
				.where(eq(judgingAssignments.id, input.id));
			return { success: true };
		})
});
