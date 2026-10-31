import assert from "node:assert/strict";
import { and, eq, inArray } from "drizzle-orm";
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
import {
	createAuthenticatedCaller,
	createUnauthenticatedCaller
} from "../helpers/auth";

async function fixture() {
	const teams = new TeamFixtureTracker();
	const accounts: Awaited<ReturnType<typeof createAuthenticatedCaller>>[] = [];
	const roundIds = [crypto.randomUUID(), crypto.randomUUID()];
	const criterionIds = [crypto.randomUUID(), crypto.randomUUID()];
	const original = await db.query.hackathonSettings.findFirst();
	onTestFinished(async () => {
		await db
			.update(hackathonSettings)
			.set({ currentRoundId: null })
			.where(eq(hackathonSettings.id, 1));
		await db.delete(judgingRounds).where(inArray(judgingRounds.id, roundIds));
		await db.delete(criteria).where(inArray(criteria.id, criterionIds));
		if (original)
			await db
				.update(hackathonSettings)
				.set(original)
				.where(eq(hackathonSettings.id, 1));
		else await db.delete(hackathonSettings).where(eq(hackathonSettings.id, 1));
		await teams.cleanup();
		for (const account of accounts) await account.cleanup();
	});
	for (const role of [Role.JUDGE, Role.JUDGE, Role.PARTICIPANT])
		accounts.push(await createAuthenticatedCaller({ role }));
	const [judgeA, judgeB, participant] = accounts;
	assert(judgeA && judgeB && participant);
	const teamA = await teams.create("Integrity A");
	const teamB = await teams.create("Integrity B");
	await db.insert(member).values({
		id: crypto.randomUUID(),
		userId: participant.user.id,
		organizationId: teamA.id,
		role: "owner",
		createdAt: new Date()
	});
	const roomIds: string[] = [];
	for (const [index, roundId] of roundIds.entries()) {
		await db.insert(judgingRounds).values({
			id: roundId,
			name: `Integrity round ${index}`,
			startTime: new Date(Date.now() - 7_200_000),
			endTime: new Date(Date.now() + 3_600_000)
		});
		const [room] = await db
			.insert(judgingRooms)
			.values({ roundId, roomLink: "https://example.com/integrity" })
			.returning();
		assert(room);
		roomIds.push(room.id);
		await db.insert(judgingRoomStaff).values(
			[judgeA, judgeB].map(({ user }) => ({
				roomId: room.id,
				staffId: user.id
			}))
		);
	}
	await db.insert(criteria).values(
		criterionIds.map((id, index) => ({
			id,
			name: `Integrity criterion ${index}`,
			maxScore: 10
		}))
	);
	const rubric = await db.query.criteria.findMany();
	const assignmentIds = Array.from({ length: 4 }, () => crypto.randomUUID());
	await db.insert(judgingAssignments).values(
		assignmentIds.map((id, index) => ({
			id,
			roomId: roomIds[index === 2 ? 1 : 0] as string,
			teamId: index === 3 ? teamB.id : teamA.id,
			timeSlot: new Date(Date.now() - 60_000)
		}))
	);
	const batch = (index: number, value: number) =>
		rubric.map((criterion) => ({
			assignmentId: assignmentIds[index] as string,
			criteriaId: criterion.id,
			score: criterion.isSidepot ? 0 : value
		}));
	const snapshot = async () =>
		(
			await db.query.scores.findMany({
				where: inArray(scores.assignmentId, assignmentIds)
			})
		).sort((a, b) => a.id.localeCompare(b.id));
	return {
		judgeA,
		judgeB,
		participant,
		roundIds,
		roomIds,
		criterionIds,
		assignmentIds,
		teamA,
		batch,
		snapshot,
		rubric
	};
}

it("SCORE01/SCORE02: every invalid batch and restricted update preserves persisted rows", async () => {
	const f = await fixture();
	const valid = f.batch(0, 6);
	await f.judgeA.caller.scores.createMany(valid);
	const before = await f.snapshot();
	const invalid = [
		[],
		valid.map((item, index) =>
			index === 0
				? { ...item, assignmentId: f.assignmentIds[2] as string }
				: item
		),
		...[-1, 1.5, 11].map((score) =>
			valid.map((item, index) => (index === 0 ? { ...item, score } : item))
		),
		valid.map((item, index) =>
			index === 0 ? { ...item, criteriaId: crypto.randomUUID() } : item
		)
	];
	for (const input of invalid) {
		await expect(
			f.judgeA.caller.scores.createMany(input)
		).rejects.toMatchObject({ code: "BAD_REQUEST" });
		expect(await f.snapshot()).toEqual(before);
	}
	const owned = before.find((row) => row.judgeId === f.judgeA.user.id);
	assert(owned);
	await expect(
		f.judgeA.caller.scores.update({ id: owned.id, score: 11 })
	).rejects.toMatchObject({ code: "BAD_REQUEST" });
	await db
		.delete(judgingRoomStaff)
		.where(
			and(
				eq(judgingRoomStaff.roomId, f.roomIds[0] as string),
				eq(judgingRoomStaff.staffId, f.judgeA.user.id)
			)
		);
	await expect(
		f.judgeA.caller.scores.update({ id: owned.id, score: 5 })
	).rejects.toMatchObject({ code: "FORBIDDEN" });
	expect(await f.snapshot()).toEqual(before);
});

it("SCORE03/SCORE04: concurrent retries and independent judge batches remain complete and unique", async () => {
	const f = await fixture();
	await f.judgeA.caller.scores.createMany(f.batch(0, 8));
	await Promise.all([
		f.judgeA.caller.scores.createMany(f.batch(0, 8)),
		f.judgeA.caller.scores.createMany(f.batch(0, 8))
	]);
	expect(await f.snapshot()).toHaveLength(f.rubric.length);
	await Promise.all([
		f.judgeA.caller.scores.createMany(f.batch(0, 3)),
		f.judgeB.caller.scores.createMany(f.batch(0, 9))
	]);
	for (const [judge, expected] of [
		[f.judgeA, 3],
		[f.judgeB, 9]
	] as const) {
		const rows = await judge.caller.scores.getByAssignment({
			assignmentId: f.assignmentIds[0] as string
		});
		expect(rows).toHaveLength(f.rubric.length);
		for (const criterion of f.rubric)
			expect(rows.find((row) => row.criteriaId === criterion.id)).toMatchObject(
				{ judgeId: judge.user.id, value: criterion.isSidepot ? 0 : expected }
			);
	}
	const rows = await f.snapshot();
	expect(
		new Set(
			rows.map((row) => `${row.assignmentId}:${row.criteriaId}:${row.judgeId}`)
		).size
	).toBe(2 * f.rubric.length);
});

it("SCORE05: released PostgreSQL averages stay scoped to the participant's team and round", async () => {
	const f = await fixture();
	for (const [index, value] of [6, 9, 4, 10].entries())
		await f.judgeA.caller.scores.createMany(f.batch(index, value));
	await db
		.insert(hackathonSettings)
		.values({ id: 1, judgingPhase: "winners_announced" })
		.onConflictDoUpdate({
			target: hackathonSettings.id,
			set: { judgingPhase: "winners_announced" }
		});
	const released = await f.participant.caller.scores.getMineReleased();
	expect(released.released).toBe(true);
	expect(released.rounds).toEqual(
		expect.arrayContaining([
			expect.objectContaining({
				roundId: f.roundIds[0],
				criterionId: f.criterionIds[0],
				value: 7.5
			}),
			expect.objectContaining({
				roundId: f.roundIds[1],
				criterionId: f.criterionIds[0],
				value: 4
			})
		])
	);
	expect(released.rounds.some((row) => row.value === 10)).toBe(false);
});

it("SCORE06: the entire public/participant endpoint matrix rejects access without writes", async () => {
	const f = await fixture();
	await f.judgeA.caller.scores.createMany(f.batch(0, 6));
	const before = await f.snapshot();
	const api = f.participant.caller.scores;
	await expect(
		createUnauthenticatedCaller().scores.getAll()
	).rejects.toMatchObject({ code: "UNAUTHORIZED" });
	const requests = [
		() => api.getAll(),
		() => api.getByAssignment({ assignmentId: f.assignmentIds[0] as string }),
		() => api.getByTeam({ teamId: f.teamA.id }),
		() => api.getByRound({ roundId: f.roundIds[0] as string }),
		() => api.getAggregatedByTeam({}),
		() => api.createMany(f.batch(0, 9)),
		() => api.update({ id: before[0]?.id as string, score: 9 })
	];
	for (const request of requests)
		await expect(request()).rejects.toMatchObject({ code: "FORBIDDEN" });
	expect(await f.snapshot()).toEqual(before);
});
