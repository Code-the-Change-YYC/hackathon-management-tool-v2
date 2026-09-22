import { eq, type SQL } from "drizzle-orm";
import { getTableConfig, PgDialect } from "drizzle-orm/pg-core";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { criteriaRouter } from "@/server/api/routers/criteria";
import { judgingAssignmentsRouter } from "@/server/api/routers/judging-assignments";
import { scoresRouter } from "@/server/api/routers/scores";
import { createTRPCContext } from "@/server/api/trpc";
import { scores } from "@/server/db/scores-schema";

const mocks = vi.hoisted(() => ({
	session: vi.fn(),
	query: {
		scores: { findFirst: vi.fn(), findMany: vi.fn() },
		criteria: { findMany: vi.fn(), findFirst: vi.fn() },
		judgingAssignments: { findFirst: vi.fn(), findMany: vi.fn() },
		judgingRoomStaff: { findMany: vi.fn() }
	},
	insert: vi.fn(),
	update: vi.fn(),
	select: vi.fn(),
	values: vi.fn(),
	conflict: vi.fn(),
	returning: vi.fn(),
	set: vi.fn(),
	where: vi.fn(),
	from: vi.fn(),
	join: vi.fn(),
	groupBy: vi.fn()
}));
vi.mock("@/server/better-auth", () => ({
	auth: { api: { getSession: mocks.session } }
}));
vi.mock("@/server/db", () => ({
	db: {
		query: mocks.query,
		insert: mocks.insert,
		update: mocks.update,
		select: mocks.select
	}
}));

const assignmentId = "11111111-1111-4111-8111-111111111111";
const criteriaId = "22222222-2222-4222-8222-222222222222";
const scoreId = "33333333-3333-4333-8333-333333333333";
const mainCriterion = {
	id: criteriaId,
	name: "Technical",
	isSidepot: false,
	maxScore: 10
};
const input = (score = 7) => [{ assignmentId, criteriaId, score }];
const dialect = new PgDialect();
const compile = (where: SQL) => dialect.sqlToQuery(where);
async function context(id = "judge-a", role = "judge") {
	mocks.session.mockResolvedValue({
		user: { id, role },
		session: { id: "test-session" }
	});
	return createTRPCContext({ headers: new Headers() });
}
async function caller(id = "judge-a", role = "judge") {
	return scoresRouter.createCaller(await context(id, role));
}
beforeEach(() => {
	vi.resetAllMocks();
	const write = {
		values: mocks.values,
		onConflictDoUpdate: mocks.conflict,
		returning: mocks.returning,
		set: mocks.set,
		where: mocks.where
	};
	mocks.insert.mockReturnValue(write);
	mocks.update.mockReturnValue(write);
	mocks.values.mockReturnValue(write);
	mocks.conflict.mockReturnValue(write);
	mocks.set.mockReturnValue(write);
	mocks.where.mockReturnValue(write);
	mocks.returning.mockResolvedValue([]);
	mocks.query.scores.findMany.mockResolvedValue([]);
	mocks.query.judgingAssignments.findFirst.mockResolvedValue({
		room: { staff: [{ staffId: "judge-a" }, { staffId: "judge-b" }] }
	});
	mocks.query.criteria.findMany.mockResolvedValue([mainCriterion]);
});

describe("individual judge scorecards", () => {
	it("attributes two judges' writes separately and scopes the upsert to their own score", async () => {
		await (await caller()).createMany(input(7));
		await (await caller("judge-b")).createMany(input(9));
		expect(mocks.values.mock.calls.map(([rows]) => rows[0])).toEqual([
			{ assignmentId, criteriaId, judgeId: "judge-a", value: 7 },
			{ assignmentId, criteriaId, judgeId: "judge-b", value: 9 }
		]);
		expect(mocks.conflict).toHaveBeenCalledWith(
			expect.objectContaining({
				target: [scores.assignmentId, scores.criteriaId, scores.judgeId]
			})
		);
		const index = getTableConfig(scores).indexes.find(
			(i) => i.config.name === "one_score_per_judge_per_criteria_per_assignment"
		);
		expect(index?.config.unique).toBe(true);
		expect(index?.config.columns).toMatchObject([
			{ name: "assignment_id" },
			{ name: "criteria_id" },
			{ name: "judge_id" }
		]);
	});
	it.each([
		0, 11, -1, 1.5
	])("rejects main score %s without writing", async (value) => {
		await expect(
			(await caller()).createMany(input(value))
		).rejects.toMatchObject({ code: "BAD_REQUEST" });
		expect(mocks.insert).not.toHaveBeenCalled();
	});
	it.each([1, 10])("accepts main boundary %s", async (value) => {
		await (await caller()).createMany(input(value));
		expect(mocks.insert).toHaveBeenCalledOnce();
	});
	it("retains the configured sidepot range, including zero", async () => {
		mocks.query.criteria.findMany.mockResolvedValue([
			{ ...mainCriterion, isSidepot: true, maxScore: 5 }
		]);
		const api = await caller();
		await api.createMany(input(0));
		await api.createMany(input(5));
		await expect(api.createMany(input(6))).rejects.toMatchObject({
			code: "BAD_REQUEST"
		});
		expect(mocks.insert).toHaveBeenCalledTimes(2);
	});
	it("rejects duplicate criteria and unknown criteria without writing", async () => {
		const api = await caller();
		await expect(
			api.createMany([...input(), ...input()])
		).rejects.toMatchObject({ code: "BAD_REQUEST" });
		mocks.query.criteria.findMany.mockResolvedValue([]);
		await expect(api.createMany(input())).rejects.toMatchObject({
			code: "BAD_REQUEST"
		});
		expect(mocks.insert).not.toHaveBeenCalled();
	});
	it("requires assignment membership even for an admin acting as a judge", async () => {
		await expect(
			(await caller("unassigned-admin", "admin")).createMany(input())
		).rejects.toMatchObject({ code: "FORBIDDEN" });
		expect(mocks.insert).not.toHaveBeenCalled();
	});
	it("does not allow participants to submit scores", async () => {
		await expect(
			(await caller("judge-a", "participant")).createMany(input())
		).rejects.toMatchObject({ code: "FORBIDDEN" });
		expect(mocks.insert).not.toHaveBeenCalled();
	});
	it("cannot update another judge's score or an unattributed legacy score", async () => {
		mocks.query.scores.findFirst.mockResolvedValue(undefined);
		await expect(
			(await caller()).update({ id: scoreId, score: 8 })
		).rejects.toMatchObject({ code: "NOT_FOUND" });
		const query = compile(
			mocks.query.scores.findFirst.mock.calls[0]?.[0].where
		);
		expect(query.params).toEqual([scoreId, "judge-a"]);
		expect(query.sql).toContain('"judge_id"');
		expect(mocks.update).not.toHaveBeenCalled();
	});
	it("checks bounds and current membership when updating an owned score", async () => {
		mocks.query.scores.findFirst.mockResolvedValue({
			assignmentId,
			criteria: mainCriterion
		});
		const api = await caller();
		await expect(api.update({ id: scoreId, score: 11 })).rejects.toMatchObject({
			code: "BAD_REQUEST"
		});
		mocks.query.judgingAssignments.findFirst.mockResolvedValue({
			room: { staff: [] }
		});
		await expect(api.update({ id: scoreId, score: 8 })).rejects.toMatchObject({
			code: "FORBIDDEN"
		});
		expect(mocks.update).not.toHaveBeenCalled();
	});
	it("updates an owned score with ownership also checked in the write", async () => {
		mocks.query.scores.findFirst.mockResolvedValue({
			assignmentId,
			criteria: mainCriterion
		});
		await (await caller()).update({ id: scoreId, score: 8 });
		expect(mocks.set).toHaveBeenCalledWith({ value: 8 });
		expect(compile(mocks.where.mock.calls[0]?.[0]).params).toEqual([
			scoreId,
			"judge-a"
		]);
	});
	it("scopes judge reads while allowing admins to inspect legacy records", async () => {
		const api = await caller();
		await api.getAll();
		await api.getByAssignment({ assignmentId });
		await api.getByTeam({ teamId: "team" });
		const [all, assignment, team] = mocks.query.scores.findMany.mock.calls.map(
			([query]) => query
		);
		expect(compile(all.where).params).toEqual(["judge-a"]);
		expect(compile(assignment.where).params).toEqual([assignmentId, "judge-a"]);
		expect(compile(team.where(scores, { eq })).params).toEqual([
			"judge-a",
			"team"
		]);
		await (await caller("admin", "admin")).getAll();
		expect(
			mocks.query.scores.findMany.mock.lastCall?.[0].where
		).toBeUndefined();
	});
	it("scopes dashboard nested scores to the requested judge", async () => {
		mocks.query.judgingRoomStaff.findMany.mockResolvedValue([
			{ roomId: "room" }
		]);
		mocks.query.judgingAssignments.findMany.mockResolvedValue([]);
		const api = judgingAssignmentsRouter.createCaller(await context());
		await api.getByJudge({ judgeId: "judge-a" });
		const query = mocks.query.judgingAssignments.findMany.mock.lastCall?.[0];
		expect(compile(query.with.scores.where).params).toEqual(["judge-a"]);
	});
	it("builds separate main totals per assignment and judge, excluding sidepots and legacy scores", async () => {
		const select = {
			from: mocks.from,
			innerJoin: mocks.join,
			where: mocks.where,
			groupBy: mocks.groupBy
		};
		mocks.select.mockReturnValue(select);
		mocks.from.mockReturnValue(select);
		mocks.join.mockReturnValue(select);
		mocks.where.mockReturnValue(select);
		mocks.groupBy.mockResolvedValue([]);
		await (await caller()).getJudgeTotals({ roundId: assignmentId });
		const fields = mocks.select.mock.lastCall?.[0];
		expect(compile(fields.mainTotal).sql).toContain(
			'filter (where "hackathon_criteria"."is_sidepot" = false)'
		);
		const filter = compile(mocks.where.mock.lastCall?.[0]);
		expect(filter.sql).toContain('"judge_id" is not null');
		expect(filter.params).toEqual([assignmentId, "judge-a"]);
		expect(mocks.groupBy.mock.lastCall?.slice(0, 2)).toEqual([
			scores.assignmentId,
			scores.judgeId
		]);
	});
	it("keeps main criteria on a ten-point scale when created or updated", async () => {
		const api = criteriaRouter.createCaller(await context("admin", "admin"));
		await expect(
			api.create({ name: "Technical", maxScore: 5 })
		).rejects.toMatchObject({ code: "BAD_REQUEST" });
		mocks.query.criteria.findFirst.mockResolvedValue(mainCriterion);
		await expect(
			api.update({ id: criteriaId, maxScore: 5 })
		).rejects.toMatchObject({ code: "BAD_REQUEST" });
		expect(mocks.insert).not.toHaveBeenCalled();
		expect(mocks.update).not.toHaveBeenCalled();
	});
});
