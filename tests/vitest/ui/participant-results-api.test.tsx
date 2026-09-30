import { PgDialect } from "drizzle-orm/pg-core";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/server/db", () => ({ db: {} }));
vi.mock("@/server/better-auth", () => ({ auth: { api: {} } }));

import { criteriaRouter } from "@/server/api/routers/criteria";
import { scoresRouter } from "@/server/api/routers/scores";

function caller(
	phase: string,
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
				findFirst: vi.fn().mockResolvedValue({ judgingPhase: phase })
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
	it.each([
		"not_started",
		"submissions_closed",
		"review",
		"judging",
		"deliberation",
		"results_ready"
	])("does not read scores or membership in %s", async (phase) => {
		const { client, db } = caller(phase);
		expect(await client.getMineReleased()).toEqual({
			released: false,
			rounds: []
		});
		expect(db.query.member.findFirst).not.toHaveBeenCalled();
		expect(db.select).not.toHaveBeenCalled();
	});
	it("rejects an unauthenticated caller", async () => {
		const { client, db } = caller("winners_announced", null, false);
		await expect(client.getMineReleased()).rejects.toMatchObject({
			code: "UNAUTHORIZED"
		});
		expect(db.select).not.toHaveBeenCalled();
	});
	it("uses the session user’s membership and restricts the SQL query to that team", async () => {
		const { client, db, where } = caller("winners_announced");
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
		const { client, db } = caller("winners_announced", null);
		expect(await client.getMineReleased()).toEqual({
			released: true,
			rounds: []
		});
		expect(db.select).not.toHaveBeenCalled();
	});
});

it("rejects scoring a criterion assigned to another round", async () => {
	const id = "11111111-1111-4111-8111-111111111111";
	const db = {
		query: {
			judgingAssignments: {
				findFirst: vi.fn().mockResolvedValue({
					room: {
						roundId: "current-round",
						staff: [{ staffId: "judge-user" }]
					}
				})
			},
			criteria: {
				findMany: vi
					.fn()
					.mockResolvedValue([{ id, maxScore: 10, roundIds: ["other-round"] }])
			}
		},
		insert: vi.fn()
	};
	const client = scoresRouter.createCaller({
		db,
		session: { user: { id: "judge-user", role: "judge" } },
		headers: new Headers()
	} as never);
	await expect(
		client.createMany([{ assignmentId: id, criteriaId: id, score: 5 }])
	).rejects.toMatchObject({
		code: "BAD_REQUEST",
		message: "Criterion is not available for this judging round."
	});
	expect(db.insert).not.toHaveBeenCalled();
});
it("rejects criteria mapped to nonexistent rounds", async () => {
	const db = {
		query: { judgingRounds: { findMany: vi.fn().mockResolvedValue([]) } },
		insert: vi.fn()
	};
	const client = criteriaRouter.createCaller({
		db,
		session: { user: { id: "admin-user", role: "admin" } },
		headers: new Headers()
	} as never);
	await expect(
		client.create({
			name: "Innovation",
			roundIds: ["11111111-1111-4111-8111-111111111111"]
		})
	).rejects.toMatchObject({ code: "BAD_REQUEST" });
	expect(db.insert).not.toHaveBeenCalled();
});
