import { TRPCError } from "@trpc/server";
import { eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { adminProcedure, createTRPCRouter } from "@/server/api/trpc";
import type { db as dbType } from "@/server/db";
import { organization, user } from "@/server/db/auth-schema";
import {
	judgingAssignments,
	judgingRoomDisplayName,
	judgingRoomStaff,
	judgingRooms,
	scores
} from "@/server/db/schema";

const RoomSchema = z.object({
	id: z.string().uuid(),
	name: z.string().min(1).optional(),
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

type JudgingRoom = typeof judgingRooms.$inferSelect;
type DbClient =
	| typeof dbType
	| Parameters<Parameters<typeof dbType.transaction>[0]>[0];

function hasPassedPrescreen(team: typeof organization.$inferSelect) {
	return team.prescreenStatus === "passed";
}

/** Build Room 1..N labels per round (ordered by createdAt). */
export async function getRoomDisplayNames(
	db: DbClient,
	roomIds: string[]
): Promise<Map<string, string>> {
	const uniqueIds = [...new Set(roomIds)];
	if (uniqueIds.length === 0) return new Map();

	const rooms = await db.query.judgingRooms.findMany({
		where: inArray(judgingRooms.id, uniqueIds),
		orderBy: (rows, { asc: orderAsc }) => [
			orderAsc(rows.createdAt),
			orderAsc(rows.id)
		]
	});

	const byRound = new Map<string, JudgingRoom[]>();
	for (const room of rooms) {
		const list = byRound.get(room.roundId) ?? [];
		list.push(room);
		byRound.set(room.roundId, list);
	}

	const names = new Map<string, string>();
	for (const list of byRound.values()) {
		list.forEach((room, index) => {
			names.set(room.id, judgingRoomDisplayName(index));
		});
	}
	return names;
}

export function withRoomDisplayName<T extends { id: string }>(
	room: T,
	names: Map<string, string>
) {
	return {
		...room,
		name: names.get(room.id) ?? "Room"
	};
}

async function assertRoundHasNoScores(db: DbClient, roundId: string) {
	const scoredAssignments = await db
		.select({ id: scores.id })
		.from(scores)
		.innerJoin(
			judgingAssignments,
			eq(scores.assignmentId, judgingAssignments.id)
		)
		.innerJoin(judgingRooms, eq(judgingAssignments.roomId, judgingRooms.id))
		.where(eq(judgingRooms.roundId, roundId))
		.limit(1);
	if (scoredAssignments.length > 0) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message:
				"Cannot replace this schedule because at least one assignment has scores."
		});
	}
}

async function assertTeamsAreSchedulable(db: DbClient, teamIds: string[]) {
	const uniqueTeamIds = [...new Set(teamIds)];
	if (uniqueTeamIds.length === 0) return;

	const teams = await db.query.organization.findMany({
		where: inArray(organization.id, uniqueTeamIds)
	});
	if (teams.length !== uniqueTeamIds.length) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "One or more teams in the layout were not found."
		});
	}

	const ineligible = teams.filter((team) => !hasPassedPrescreen(team));
	if (ineligible.length > 0) {
		throw new TRPCError({
			code: "CONFLICT",
			message: "Only prescreen-passed teams can be assigned to judging rooms."
		});
	}
}

export const judgingRoomsRouter = createTRPCRouter({
	getLayoutByRound: adminProcedure
		.input(z.object({ roundId: z.string().uuid() }))
		.query(async ({ ctx, input }) => {
			const rooms = await ctx.db.query.judgingRooms.findMany({
				where: eq(judgingRooms.roundId, input.roundId),
				with: { assignments: true },
				orderBy: (rows, { asc: orderAsc }) => [
					orderAsc(rows.createdAt),
					orderAsc(rows.id)
				]
			});

			const staffByRoom = await Promise.all(
				rooms.map(async (room) => {
					const staffRows = await ctx.db.query.judgingRoomStaff.findMany({
						where: eq(judgingRoomStaff.roomId, room.id)
					});
					return staffRows.map((row) => row.staffId);
				})
			);

			return {
				rooms: rooms.map((room, index) => ({
					id: room.id,
					name: judgingRoomDisplayName(index),
					roomLink: room.roomLink,
					staffIds: staffByRoom[index] ?? [],
					teamIds: room.assignments.map((a) => a.teamId),
					teamTimeSlots: Object.fromEntries(
						room.assignments.map((a) => [
							a.teamId,
							a.timeSlot ? a.timeSlot.toISOString() : null
						])
					)
				}))
			};
		}),

	saveLayoutByRound: adminProcedure
		.input(z.object({ roundId: z.string().uuid(), layout: LayoutSchema }))
		.mutation(async ({ ctx, input }) => {
			const teamIds = input.layout.rooms.flatMap((room) => room.teamIds);

			await ctx.db.transaction(async (tx) => {
				await assertRoundHasNoScores(tx, input.roundId);
				await assertTeamsAreSchedulable(tx, teamIds);

				await tx
					.delete(judgingRooms)
					.where(eq(judgingRooms.roundId, input.roundId));

				for (const room of input.layout.rooms) {
					const [createdRoom] = await tx
						.insert(judgingRooms)
						.values({
							roundId: input.roundId,
							roomLink: room.roomLink ?? ""
						})
						.returning();

					if (!createdRoom) continue;

					if (room.staffIds.length > 0) {
						await tx.insert(judgingRoomStaff).values(
							room.staffIds.map((staffId) => ({
								roomId: createdRoom.id,
								staffId
							}))
						);
					}

					if (room.teamIds.length > 0) {
						await tx.insert(judgingAssignments).values(
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
			});

			const rooms = await ctx.db.query.judgingRooms.findMany({
				where: eq(judgingRooms.roundId, input.roundId)
			});
			return { success: true, roomsCreated: rooms.length };
		}),

	generateSchedule: adminProcedure
		.input(
			z.object({
				roundId: z.string().uuid(),
				roomCount: z.number().int().min(1),
				judgesPerRoom: z.number().int().min(1).default(1),
				slotDurationMinutes: z.number().int().min(1),
				totalJudgingMinutes: z.number().int().min(1)
			})
		)
		.mutation(async ({ ctx, input }) => {
			const round = await ctx.db.query.judgingRounds.findFirst({
				where: (rounds, { eq: equals }) => equals(rounds.id, input.roundId)
			});
			if (!round) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Judging round not found."
				});
			}

			const judges = await ctx.db.query.user.findMany({
				where: eq(user.role, "judge"),
				orderBy: (users, { asc: orderAsc }) => [orderAsc(users.name)]
			});
			const judgesNeeded = input.roomCount * input.judgesPerRoom;
			if (judges.length < judgesNeeded) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: `Need ${judgesNeeded} judges (${input.judgesPerRoom} per room × ${input.roomCount} rooms), but only ${judges.length} are available.`
				});
			}

			const teams = await ctx.db.query.organization.findMany({
				orderBy: (orgs, { asc: orderAsc }) => [orderAsc(orgs.name)]
			});
			const eligibleTeams = teams.filter(hasPassedPrescreen);
			if (eligibleTeams.length === 0) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "No prescreen-passed teams found to schedule."
				});
			}

			const slotCount = Math.floor(
				input.totalJudgingMinutes / input.slotDurationMinutes
			);
			const capacity = input.roomCount * slotCount;
			if (slotCount < 1 || capacity < eligibleTeams.length) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message:
						"Not enough judging capacity for all eligible teams. Increase total time, shorten slots, or add rooms."
				});
			}

			const finalSlotIndex = Math.floor(
				(eligibleTeams.length - 1) / input.roomCount
			);
			const scheduleEndsAt = new Date(
				round.startTime.getTime() +
					(finalSlotIndex + 1) * input.slotDurationMinutes * 60_000
			);
			if (scheduleEndsAt > round.endTime) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message:
						"Generated schedule would end after the selected round's end time."
				});
			}

			await ctx.db.transaction(async (tx) => {
				await assertRoundHasNoScores(tx, input.roundId);
				await assertTeamsAreSchedulable(
					tx,
					eligibleTeams.map((team) => team.id)
				);

				await tx
					.delete(judgingRooms)
					.where(eq(judgingRooms.roundId, input.roundId));

				const createdRooms: JudgingRoom[] = [];
				for (let i = 0; i < input.roomCount; i++) {
					const [createdRoom] = await tx
						.insert(judgingRooms)
						.values({
							roundId: input.roundId,
							roomLink: ""
						})
						.returning();
					if (createdRoom) createdRooms.push(createdRoom);
				}

				for (let i = 0; i < createdRooms.length; i++) {
					const room = createdRooms[i];
					if (!room) continue;
					const roomJudges = judges.slice(
						i * input.judgesPerRoom,
						(i + 1) * input.judgesPerRoom
					);
					await tx.insert(judgingRoomStaff).values(
						roomJudges.map((judge) => ({
							roomId: room.id,
							staffId: judge.id
						}))
					);
				}

				await tx.insert(judgingAssignments).values(
					eligibleTeams.map((team, index) => {
						const roomIndex = index % input.roomCount;
						const slotIndex = Math.floor(index / input.roomCount);
						const room = createdRooms[roomIndex];
						if (!room) {
							throw new TRPCError({
								code: "INTERNAL_SERVER_ERROR",
								message: "Failed to create a room for scheduling."
							});
						}
						return {
							roomId: room.id,
							teamId: team.id,
							timeSlot: new Date(
								round.startTime.getTime() +
									slotIndex * input.slotDurationMinutes * 60_000
							)
						};
					})
				);
			});

			return {
				success: true,
				roomsCreated: input.roomCount,
				assignmentsCreated: eligibleTeams.length,
				message: `Generated ${eligibleTeams.length} assignments across ${input.roomCount} rooms.`
			};
		})
});
