import { PgDialect } from "drizzle-orm/pg-core";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/server/db", () => ({ db: {} }));
vi.mock("@/server/better-auth", () => ({ auth: { api: {} } }));

import { scoresRouter } from "@/server/api/routers/scores";

const assignmentId = "11111111-1111-4111-8111-111111111111";
const mainId = "22222222-2222-4222-8222-222222222222";
const sideId = "33333333-3333-4333-8333-333333333333";
const valid = [
	{ assignmentId, criteriaId: mainId, score: 4 },
	{ assignmentId, criteriaId: sideId, score: 0 }
];
const otherRoundId = "55555555-5555-4555-8555-555555555555";
const rubric = [
	{ id: mainId, maxScore: 5, isSidepot: false, roundIds: [] },
	{ id: sideId, maxScore: 5, isSidepot: true, roundIds: ["round"] },
	{ id: otherRoundId, maxScore: 5, isSidepot: true, roundIds: ["other-round"] }
];
const db = {
	query: {
		judgingAssignments: { findFirst: vi.fn() },
		judgingCriteria: { findMany: vi.fn(), findFirst: vi.fn() },
		judgingScores: { findMany: vi.fn(), findFirst: vi.fn() }
	},
	insert: vi.fn(),
	update: vi.fn()
};
const write = {
	values: vi.fn(),
	onConflictDoUpdate: vi.fn(),
	returning: vi.fn()
};
function caller(id = "judge-a", role = "judge") {
	return scoresRouter.createCaller({
		db,
		session: { user: { id, role } },
		headers: new Headers()
	} as never);
}
beforeEach(() => {
	vi.resetAllMocks();
	db.query.judgingAssignments.findFirst.mockResolvedValue({
		id: assignmentId,
		startsAt: new Date(0),
		table: {
			roundId: "round",
			judges: [{ judgeId: "judge-a" }, { judgeId: "judge-b" }]
		}
	});
	db.query.judgingCriteria.findMany.mockResolvedValue(rubric);
	db.query.judgingScores.findMany.mockResolvedValue([]);
	db.insert.mockReturnValue(write);
	write.values.mockReturnValue(write);
	write.onConflictDoUpdate.mockReturnValue(write);
	write.returning.mockResolvedValue([]);
});

describe("individual scorecard API", () => {
	it("derives ownership from the session and upserts on the judge-specific key", async () => {
		await caller().createMany(
			valid.map((item) => ({ ...item, judgeId: "judge-b" }))
		);
		expect(write.values).toHaveBeenCalledWith(
			valid.map(({ score, ...item }) => ({
				...item,
				judgeId: "judge-a",
				value: score
			}))
		);
		expect(
			write.onConflictDoUpdate.mock.calls[0]?.[0].target.map(
				(column: { name: string }) => column.name
			)
		).toEqual(["assignment_id", "criteria_id", "judge_id"]);
		await caller("judge-b").createMany(valid);
		expect(write.values.mock.calls[1]?.[0][0].judgeId).toBe("judge-b");
	});
	it("only requires the criteria that apply to the assignment's round", async () => {
		await expect(caller().createMany(valid)).resolves.toEqual([]);
		await expect(
			caller().createMany([
				...valid,
				{ assignmentId, criteriaId: otherRoundId, score: 0 }
			])
		).rejects.toMatchObject({ code: "BAD_REQUEST" });
		expect(db.insert).toHaveBeenCalledOnce();
	});
	it.each([
		["missing", valid.slice(0, 1)],
		["duplicate", [valid[0], valid[0]]],
		[
			"unknown",
			[
				valid[0],
				{ ...valid[1], criteriaId: "44444444-4444-4444-8444-444444444444" }
			]
		],
		["out of range", [{ ...valid[0], score: 6 }, valid[1]]],
		["negative", [{ ...valid[0], score: -1 }, valid[1]]],
		["noninteger", [{ ...valid[0], score: 1.5 }, valid[1]]],
		["mixed assignments", [valid[0], { ...valid[1], assignmentId: sideId }]]
	])("rejects %s scorecards before writing", async (_label, input) => {
		await expect(
			caller().createMany(input as typeof valid)
		).rejects.toMatchObject({ code: "BAD_REQUEST" });
		expect(db.insert).not.toHaveBeenCalled();
	});
	it("rejects an unassigned judge for reads and writes", async () => {
		const outsider = caller("outsider");
		await expect(
			outsider.getByAssignment({ assignmentId })
		).rejects.toMatchObject({ code: "FORBIDDEN" });
		await expect(outsider.createMany(valid)).rejects.toMatchObject({
			code: "FORBIDDEN"
		});
		expect(db.query.judgingScores.findMany).not.toHaveBeenCalled();
		expect(db.insert).not.toHaveBeenCalled();
	});
	it("does not let an unassigned admin contribute a scorecard", async () => {
		await expect(
			caller("admin", "admin").createMany(valid)
		).rejects.toMatchObject({ code: "FORBIDDEN" });
	});
	it("scopes assignment scores to the signed-in judge", async () => {
		await caller().getByAssignment({ assignmentId });
		const query = new PgDialect().sqlToQuery(
			db.query.judgingScores.findMany.mock.calls[0]?.[0].where
		);
		expect(query.params).toEqual([assignmentId, "judge-a"]);
	});
	it("scopes raw scores to the current judge and keeps team averages organizer-only", async () => {
		await caller().getAll();
		const where = db.query.judgingScores.findMany.mock.lastCall?.[0].where;
		expect(new PgDialect().sqlToQuery(where).params).toEqual(["judge-a"]);
		await expect(caller().getAggregatedByTeam({})).rejects.toMatchObject({
			code: "FORBIDDEN"
		});
	});

	it("enforces scheduled availability while allowing later updates", async () => {
		db.query.judgingAssignments.findFirst.mockResolvedValue({
			startsAt: new Date(Date.now() + 3600000),
			table: { roundId: "round", judges: [{ judgeId: "judge-a" }] }
		});
		db.query.judgingScores.findFirst.mockResolvedValue(undefined);
		await expect(caller().createMany(valid)).rejects.toMatchObject({
			code: "FORBIDDEN"
		});
		db.query.judgingScores.findFirst.mockResolvedValue({ judgeId: "judge-a" });
		await expect(caller().createMany(valid)).resolves.toEqual([]);
	});
	it("prevents editing another judge's score through the single-score endpoint", async () => {
		db.query.judgingScores.findFirst.mockResolvedValue(undefined);
		await expect(
			caller().update({ id: mainId, score: 2 })
		).rejects.toMatchObject({ code: "NOT_FOUND" });
		const where = db.query.judgingScores.findFirst.mock.lastCall?.[0].where;
		expect(new PgDialect().sqlToQuery(where).params).toEqual([
			mainId,
			"judge-a"
		]);
		expect(db.update).not.toHaveBeenCalled();
	});
});
