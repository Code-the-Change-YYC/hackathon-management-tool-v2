import { eq } from "drizzle-orm";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { db } from "@/server/db";
import { member, organization } from "@/server/db/auth-schema";
import { assertE2EDatabaseSafety } from "../../e2e/db";
import { createAuthenticatedCaller } from "../helpers/auth";

type TestCaller = Awaited<ReturnType<typeof createAuthenticatedCaller>>;

const cleanups: (() => Promise<void>)[] = [];

async function participant() {
	const testCaller = await createAuthenticatedCaller();
	cleanups.push(testCaller.cleanup);
	return testCaller;
}

async function teamWith(owner: TestCaller, ...joiners: TestCaller[]) {
	const team = await owner.caller.teams.create({
		name: `Leave Test ${crypto.randomUUID().slice(0, 8)}`
	});
	if (!team?.teamCode) throw new Error("Team was not created");
	cleanups.push(async () => {
		await db.delete(organization).where(eq(organization.id, team.id));
	});
	for (const joiner of joiners) {
		await joiner.caller.teams.join({ teamCode: team.teamCode });
	}
	return team;
}

async function roles(teamId: string) {
	const rows = await db.query.member.findMany({
		where: eq(member.organizationId, teamId)
	});
	return Object.fromEntries(rows.map((row) => [row.userId, row.role]));
}

describe("teams.leave", () => {
	beforeAll(() => {
		assertE2EDatabaseSafety();
	});

	afterEach(async () => {
		for (const cleanup of cleanups.splice(0).reverse()) {
			await cleanup();
		}
	});

	it("promotes the earliest-joined member when the owner leaves", async () => {
		const owner = await participant();
		const second = await participant();
		const third = await participant();
		const team = await teamWith(owner, second, third);

		// Make the later joiner the earliest member, so the test can't pass on
		// insertion order alone.
		await db
			.update(member)
			.set({ createdAt: new Date(Date.now() + 60_000) })
			.where(eq(member.userId, second.user.id));

		await owner.caller.teams.leave();

		expect(await roles(team.id)).toEqual({
			[second.user.id]: "member",
			[third.user.id]: "owner"
		});
		const myTeam = await third.caller.teams.getMyTeam();
		expect(myTeam?.myRole).toBe("owner");
	});

	it("leaves the owner in place when a member leaves", async () => {
		const owner = await participant();
		const joiner = await participant();
		const team = await teamWith(owner, joiner);

		await joiner.caller.teams.leave();

		expect(await roles(team.id)).toEqual({ [owner.user.id]: "owner" });
	});

	it("deletes the team when its last member leaves", async () => {
		const owner = await participant();
		const team = await teamWith(owner);

		await owner.caller.teams.leave();

		const remaining = await db.query.organization.findFirst({
			where: eq(organization.id, team.id)
		});
		expect(remaining).toBeUndefined();
	});
});
