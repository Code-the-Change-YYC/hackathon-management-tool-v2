import assert from "node:assert/strict";
import { eq } from "drizzle-orm";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { db } from "@/server/db";
import { member, organization } from "@/server/db/auth-schema";
import {
	judgingAssignments,
	judgingCriteria,
	judgingRounds,
	judgingScores,
	judgingTables
} from "@/server/db/judging-schema";
import { Role } from "@/types/types";
import { assertE2EDatabaseSafety } from "../../e2e/db";
import { createAuthenticatedCaller } from "../helpers/auth";

type TestCaller = Awaited<ReturnType<typeof createAuthenticatedCaller>>;

const cleanups: (() => Promise<void>)[] = [];

async function testCaller(role: Role) {
	const created = await createAuthenticatedCaller({ role });
	cleanups.push(created.cleanup);
	return created;
}

async function createTeam(owner: TestCaller) {
	const team = await owner.caller.teams.create({
		name: `Judged Test ${crypto.randomUUID().slice(0, 8)}`
	});
	assert(team);
	cleanups.push(async () => {
		await db.delete(organization).where(eq(organization.id, team.id));
	});
	await db
		.update(organization)
		.set({ prescreenStatus: "passed" })
		.where(eq(organization.id, team.id));
	return team;
}

// A panel round with two tables. Deleting it takes its assignments and scores.
async function createRound() {
	const [round] = await db
		.insert(judgingRounds)
		.values({
			name: "Judged team test",
			kind: "panel",
			startTime: new Date(),
			endTime: new Date(Date.now() + 3_600_000),
			publishedAt: new Date()
		})
		.returning();
	assert(round);
	cleanups.push(async () => {
		await db.delete(judgingRounds).where(eq(judgingRounds.id, round.id));
	});
	const tables = await db
		.insert(judgingTables)
		.values([
			{ roundId: round.id, tableNumber: 1 },
			{ roundId: round.id, tableNumber: 2 }
		])
		.returning();
	const [first, second] = tables;
	assert(first && second);
	return { round, tables: [first, second] as const };
}

async function schedule(teamId: string, tableId: string, minutes: number) {
	const [assignment] = await db
		.insert(judgingAssignments)
		.values({
			teamId,
			tableId,
			startsAt: new Date(Date.now() + minutes * 60_000)
		})
		.returning();
	assert(assignment);
	return assignment;
}

async function score(assignmentId: string, judgeId: string) {
	const criterionId = crypto.randomUUID();
	cleanups.push(async () => {
		await db
			.delete(judgingScores)
			.where(eq(judgingScores.criteriaId, criterionId));
		await db.delete(judgingCriteria).where(eq(judgingCriteria.id, criterionId));
	});
	await db
		.insert(judgingCriteria)
		.values({ id: criterionId, name: "Judged team test", maxScore: 5 });
	await db
		.insert(judgingScores)
		.values({ assignmentId, criteriaId: criterionId, judgeId, value: 4 });
}

async function teamAssignments(teamId: string) {
	return db.query.judgingAssignments.findMany({
		where: eq(judgingAssignments.teamId, teamId)
	});
}

describe("teams with judging results", () => {
	beforeAll(() => {
		assertE2EDatabaseSafety();
	});

	afterEach(async () => {
		for (const cleanup of cleanups.splice(0).reverse()) {
			await cleanup();
		}
	});

	it("keeps a judged team when an admin deletes it or its last member leaves", async () => {
		const admin = await testCaller(Role.ADMIN);
		const judge = await testCaller(Role.JUDGE);
		const owner = await testCaller(Role.PARTICIPANT);
		const team = await createTeam(owner);
		const { tables } = await createRound();
		const scored = await schedule(team.id, tables[0].id, 0);
		await schedule(team.id, tables[1].id, 12);
		await score(scored.id, judge.user.id);

		await expect(
			admin.caller.teams.delete({ id: team.id })
		).rejects.toMatchObject({
			code: "CONFLICT",
			message:
				"This team has judging scores or final-round votes, so it can’t be deleted."
		});
		expect(await teamAssignments(team.id)).toHaveLength(2);

		await owner.caller.teams.leave();
		expect(
			await db.query.organization.findFirst({
				where: eq(organization.id, team.id)
			})
		).toBeDefined();
		expect(
			await db.query.member.findMany({
				where: eq(member.organizationId, team.id)
			})
		).toEqual([]);
		expect(await teamAssignments(team.id)).toHaveLength(2);

		const { teams } = await admin.caller.teams.getTeamsWithMembers();
		expect(teams.find(({ id }) => id === team.id)?.judged).toBe(true);
	});

	it("frees an unjudged team's slots when it's deleted", async () => {
		const admin = await testCaller(Role.ADMIN);
		const owner = await testCaller(Role.PARTICIPANT);
		const team = await createTeam(owner);
		const { tables } = await createRound();
		await schedule(team.id, tables[0].id, 0);
		await schedule(team.id, tables[1].id, 12);

		await expect(admin.caller.teams.delete({ id: team.id })).resolves.toEqual({
			success: true,
			id: team.id
		});
		expect(await teamAssignments(team.id)).toEqual([]);
	});

	it("drops a failed team's unjudged slots and leaves it out of the ranking", async () => {
		const admin = await testCaller(Role.ADMIN);
		const judge = await testCaller(Role.JUDGE);
		const failing = await createTeam(await testCaller(Role.PARTICIPANT));
		const other = await createTeam(await testCaller(Role.PARTICIPANT));
		const { round, tables } = await createRound();
		const scored = await schedule(failing.id, tables[0].id, 0);
		await schedule(failing.id, tables[1].id, 12);
		await schedule(other.id, tables[0].id, 12);

		await score(scored.id, judge.user.id);
		const before = await admin.caller.judgingResults.getPanelRanking({
			roundId: round.id
		});
		expect(before.main.map(({ teamId }) => teamId)).toContain(failing.id);

		const result = await admin.caller.teams.setPrescreen({
			teamId: failing.id,
			status: "failed",
			comments: "Built before the hackathon started"
		});
		expect(result).toMatchObject({
			prescreenStatus: "failed",
			removedSlots: 1
		});
		expect((await teamAssignments(failing.id)).map(({ id }) => id)).toEqual([
			scored.id
		]);

		const after = await admin.caller.judgingResults.getPanelRanking({
			roundId: round.id
		});
		const rankedIds = after.main.map(({ teamId }) => teamId);
		expect(rankedIds).not.toContain(failing.id);
		expect(rankedIds).toContain(other.id);
		expect(after.failedTeamNames).toEqual([failing.name]);
		for (const sidepot of after.sidepots) {
			expect(sidepot.ranking.map(({ teamId }) => teamId)).not.toContain(
				failing.id
			);
		}
	});
});
