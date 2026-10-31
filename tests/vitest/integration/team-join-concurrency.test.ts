import assert from "node:assert/strict";
import { eq, inArray } from "drizzle-orm";
import { describe, expect, it, onTestFinished } from "vitest";
import { db } from "@/server/db";
import { member } from "@/server/db/auth-schema";
import { TeamFixtureTracker } from "../../utils/teams";
import { createAuthenticatedCaller } from "../helpers/auth";

async function fixtures(count: number) {
	const teams = new TeamFixtureTracker();
	const users: Awaited<ReturnType<typeof createAuthenticatedCaller>>[] = [];
	onTestFinished(async () => {
		await teams.cleanup();
		for (const account of users) await account.cleanup();
	});
	for (let index = 0; index < count; index++)
		users.push(await createAuthenticatedCaller());
	return { teams, users };
}

// Both callbacks wait on the same gate, so neither request finishes before the
// competing request has been prepared. The routers use separate DB transactions.
async function simultaneously<T>(requests: (() => Promise<T>)[]) {
	let release!: () => void;
	const gate = new Promise<void>((resolve) => {
		release = resolve;
	});
	const pending = requests.map(async (request) => {
		await gate;
		return request();
	});
	release();
	return Promise.allSettled(pending);
}

describe("HMTV2-62 team membership under concurrent joins", () => {
	it("TEAM01: commits only one contender for the final team place", async () => {
		const { teams, users } = await fixtures(6);
		const team = await teams.create("Final place");
		assert(team.teamCode);
		await db.insert(member).values(
			users.slice(0, 4).map(({ user }, index) => ({
				id: crypto.randomUUID(),
				organizationId: team.id,
				userId: user.id,
				role: index === 0 ? ("owner" as const) : ("member" as const),
				createdAt: new Date()
			}))
		);
		const contenders = users.slice(4);
		const results = await simultaneously(
			contenders.map(
				({ caller }) =>
					() =>
						caller.teams.join({ teamCode: team.teamCode as string })
			)
		);
		expect(
			results.filter((result) => result.status === "fulfilled")
		).toHaveLength(1);
		const rejectedIndex = results.findIndex(
			(result) => result.status === "rejected"
		);
		const rejection = results[rejectedIndex];
		assert(rejection?.status === "rejected");
		expect(rejection.reason).toMatchObject({
			code: "BAD_REQUEST",
			message: expect.stringContaining("full")
		});
		expect(
			await db.query.member.findMany({
				where: eq(member.organizationId, team.id)
			})
		).toHaveLength(5);
		const rejectedUser = contenders[rejectedIndex];
		assert(rejectedUser);
		expect(
			await db.query.member.findMany({
				where: eq(member.userId, rejectedUser.user.id)
			})
		).toHaveLength(0);
	});

	it("TEAM02: cannot commit membership in two different teams", async () => {
		const { teams, users } = await fixtures(1);
		const account = users[0];
		assert(account);
		const targets = [await teams.create("First"), await teams.create("Second")];
		const results = await simultaneously(
			targets.map(
				(team) => () =>
					account.caller.teams.join({ teamCode: team.teamCode as string })
			)
		);
		expect(
			results.filter((result) => result.status === "fulfilled")
		).toHaveLength(1);
		const rejected = results.find((result) => result.status === "rejected");
		assert(rejected?.status === "rejected");
		expect(rejected.reason).toMatchObject({
			code: "BAD_REQUEST",
			message: expect.stringContaining("already")
		});
		const memberships = await db.query.member.findMany({
			where: eq(member.userId, account.user.id)
		});
		expect(memberships).toHaveLength(1);
		expect(targets.map((team) => team.id)).toContain(
			memberships[0]?.organizationId
		);
		expect(
			await db.query.member.findMany({
				where: inArray(
					member.organizationId,
					targets.map((team) => team.id)
				)
			})
		).toHaveLength(1);
	});
});
