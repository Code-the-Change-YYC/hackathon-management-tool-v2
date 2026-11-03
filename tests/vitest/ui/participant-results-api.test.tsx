import { PgDialect } from "drizzle-orm/pg-core";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/server/db", () => ({ db: {} }));
vi.mock("@/server/better-auth", () => ({ auth: { api: {} } }));

import { scoresRouter } from "@/server/api/routers/scores";

function caller(
	scoresReleased: boolean,
	organizationId: string | null = "own-team",
	loggedIn = true
) {
	const groupBy = vi
		.fn()
		.mockResolvedValue([
			{ roundId: "round", criterionId: "criterion", value: 7.5 }
		]);
	const where = vi.fn().mockReturnValue({ groupBy });
	const chain = { innerJoin: vi.fn(), where };
	chain.innerJoin.mockReturnValue(chain);
	const db = {
		query: {
			hackathonSettings: {
				findFirst: vi.fn().mockResolvedValue({ scoresReleased })
			},
			member: {
				findFirst: vi
					.fn()
					.mockResolvedValue(organizationId ? { organizationId } : undefined)
			}
		},
		select: vi.fn().mockReturnValue({ from: vi.fn().mockReturnValue(chain) })
	};
	const client = scoresRouter.createCaller({
		db,
		session: loggedIn
			? { user: { id: "participant-user", role: "participant" } }
			: null,
		headers: new Headers()
	} as never);
	return { client, db, where };
}

describe("participant result access", () => {
	it("does not read scores or membership before scores are released", async () => {
		const { client, db } = caller(false);
		expect(await client.getMineReleased()).toEqual({
			released: false,
			rounds: []
		});
		expect(db.query.member.findFirst).not.toHaveBeenCalled();
		expect(db.select).not.toHaveBeenCalled();
	});
	it("rejects an unauthenticated caller", async () => {
		const { client, db } = caller(true, null, false);
		await expect(client.getMineReleased()).rejects.toMatchObject({
			code: "UNAUTHORIZED"
		});
		expect(db.select).not.toHaveBeenCalled();
	});
	it("uses the session user’s membership and restricts the SQL query to that team", async () => {
		const { client, db, where } = caller(true);
		expect(await client.getMineReleased()).toEqual({
			released: true,
			rounds: [{ roundId: "round", criterionId: "criterion", value: 7.5 }]
		});
		const dialect = new PgDialect();
		const membership = dialect.sqlToQuery(
			db.query.member.findFirst.mock.calls[0]?.[0].where
		);
		expect(membership.params).toEqual(["participant-user"]);
		expect(dialect.sqlToQuery(where.mock.calls[0]?.[0]).params).toEqual([
			"own-team"
		]);
	});
	it("returns no scores when the user has no team", async () => {
		const { client, db } = caller(true, null);
		expect(await client.getMineReleased()).toEqual({
			released: true,
			rounds: []
		});
		expect(db.select).not.toHaveBeenCalled();
	});
});
