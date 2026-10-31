import assert from "node:assert/strict";
import { eq, inArray } from "drizzle-orm";
import { expect, it, onTestFinished } from "vitest";
import { db } from "@/server/db";
import { member } from "@/server/db/auth-schema";
import {
	hackathonSettings,
	judgingAssignments,
	judgingRoomStaff,
	judgingRooms,
	judgingRounds
} from "@/server/db/schema";
import { criteria, scores } from "@/server/db/scores-schema";
import { Role } from "@/types/types";
import { TeamFixtureTracker } from "../../utils/teams";
import { createAuthenticatedCaller } from "../helpers/auth";

it("HMTV2-59: advances rounds without resetting assignments or scores and releases both rounds", async () => {
	const teams = new TeamFixtureTracker();
	const admin = await createAuthenticatedCaller({ role: Role.ADMIN });
	const judge = await createAuthenticatedCaller({ role: Role.JUDGE });
	const participant = await createAuthenticatedCaller();
	const roundIds = [crypto.randomUUID(), crypto.randomUUID()];
	const criterionId = crypto.randomUUID();
	const original = await db.query.hackathonSettings.findFirst();
	onTestFinished(async () => {
		await db
			.update(hackathonSettings)
			.set({ currentRoundId: null })
			.where(eq(hackathonSettings.id, 1));
		await db.delete(judgingRounds).where(inArray(judgingRounds.id, roundIds));
		await db.delete(criteria).where(eq(criteria.id, criterionId));
		if (original)
			await db
				.update(hackathonSettings)
				.set(original)
				.where(eq(hackathonSettings.id, 1));
		else await db.delete(hackathonSettings).where(eq(hackathonSettings.id, 1));
		await teams.cleanup();
		await participant.cleanup();
		await judge.cleanup();
		await admin.cleanup();
	});
	const team = await teams.create("Multi-round finalist");
	await db
		.insert(member)
		.values({
			id: crypto.randomUUID(),
			organizationId: team.id,
			userId: participant.user.id,
			role: "owner",
			createdAt: new Date()
		});
	await db
		.insert(criteria)
		.values({ id: criterionId, name: "Multi-round evidence", maxScore: 10 });
	const rubric = await db.query.criteria.findMany();
	const assignmentIds: string[] = [];
	for (const [index, roundId] of roundIds.entries()) {
		await db
			.insert(judgingRounds)
			.values({
				id: roundId,
				name: `Workflow round ${index + 1}`,
				startTime: new Date(Date.now() - (4 - index) * 3_600_000),
				endTime: new Date(Date.now() - (3 - index) * 3_600_000)
			});
		const [room] = await db
			.insert(judgingRooms)
			.values({ roundId, roomLink: `https://example.com/round-${index + 1}` })
			.returning();
		assert(room);
		await db
			.insert(judgingRoomStaff)
			.values({ roomId: room.id, staffId: judge.user.id });
		const [assignment] = await db
			.insert(judgingAssignments)
			.values({
				teamId: team.id,
				roomId: room.id,
				timeSlot: new Date(Date.now() - 3_600_000)
			})
			.returning();
		assert(assignment);
		assignmentIds.push(assignment.id);
	}
	await admin.caller.hackathonSettings.update({
		currentRoundId: roundIds[0],
		judgingPhase: "judging"
	});
	expect(
		await participant.caller.judgingAssignments.getMineForActiveRound()
	).toMatchObject({ id: assignmentIds[0], teamId: team.id });
	const batch = (assignmentId: string, value: number) =>
		rubric.map((criterion) => ({
			assignmentId,
			criteriaId: criterion.id,
			score: criterion.isSidepot ? 0 : value
		}));
	assert(assignmentIds[0] && assignmentIds[1]);
	await judge.caller.scores.createMany(batch(assignmentIds[0], 6));
	const firstRound = await db.query.scores.findMany({
		where: eq(scores.assignmentId, assignmentIds[0])
	});
	expect(await participant.caller.scores.getMineReleased()).toEqual({
		released: false,
		rounds: []
	});
	await admin.caller.hackathonSettings.update({ currentRoundId: roundIds[1] });
	expect(
		await participant.caller.judgingAssignments.getMineForActiveRound()
	).toMatchObject({ id: assignmentIds[1], teamId: team.id });
	await judge.caller.scores.createMany(batch(assignmentIds[1], 9));
	expect(
		await db.query.scores.findMany({
			where: eq(scores.assignmentId, assignmentIds[0])
		})
	).toEqual(firstRound);
	await admin.caller.hackathonSettings.update({
		judgingPhase: "winners_announced"
	});
	const released = await participant.caller.scores.getMineReleased();
	expect(released.released).toBe(true);
	expect(released.rounds).toEqual(
		expect.arrayContaining([
			expect.objectContaining({ roundId: roundIds[0], criterionId, value: 6 }),
			expect.objectContaining({ roundId: roundIds[1], criterionId, value: 9 })
		])
	);
});
