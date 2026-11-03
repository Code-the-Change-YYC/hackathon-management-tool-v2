import { addMinutes } from "date-fns";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/server/db", () => ({ db: {} }));
vi.mock("@/server/better-auth", () => ({ auth: { api: {} } }));

import { judgingAssignmentsRouter } from "@/server/api/routers/judging-assignments";
import { judgingRoundsRouter } from "@/server/api/routers/judging-rounds";
import { judgingTablesRouter } from "@/server/api/routers/judging-tables";

const roundId = "11111111-1111-4111-8111-111111111111";
const tableA = "22222222-2222-4222-8222-222222222222";
const tableB = "33333333-3333-4333-8333-333333333333";
const start = new Date("2026-11-07T19:00:00Z");
const panelRound = {
	id: roundId,
	kind: "panel",
	startTime: start,
	endTime: addMinutes(start, 180),
	publishedAt: null as Date | null,
	presentationMinutes: 8 as number | null,
	changeoverMinutes: 2
};

const write = {
	values: vi.fn(),
	returning: vi.fn(),
	set: vi.fn(),
	where: vi.fn()
};
const scoreCheck = {
	from: vi.fn(),
	innerJoin: vi.fn(),
	where: vi.fn(),
	limit: vi.fn()
};
const db = {
	query: {
		judgingRounds: { findFirst: vi.fn() },
		judgingTables: { findFirst: vi.fn(), findMany: vi.fn() },
		judgingTableJudges: { findFirst: vi.fn() },
		judgingAssignments: { findMany: vi.fn() },
		organization: { findFirst: vi.fn(), findMany: vi.fn() },
		user: { findFirst: vi.fn(), findMany: vi.fn() },
		member: { findFirst: vi.fn() }
	},
	select: vi.fn(),
	insert: vi.fn(),
	update: vi.fn(),
	delete: vi.fn(),
	transaction: async (run: (tx: unknown) => unknown) => run(db)
};
const context = (role = "admin") =>
	({
		db,
		session: { user: { id: "current-user", role } },
		headers: new Headers()
	}) as never;

beforeEach(() => {
	vi.resetAllMocks();
	for (const method of [write.values, write.set, write.where]) {
		method.mockReturnValue(write);
	}
	write.returning.mockResolvedValue([]);
	db.insert.mockReturnValue(write);
	db.update.mockReturnValue(write);
	db.delete.mockReturnValue(write);
	db.select.mockReturnValue(scoreCheck);
	scoreCheck.from.mockReturnValue(scoreCheck);
	scoreCheck.innerJoin.mockReturnValue(scoreCheck);
	scoreCheck.where.mockReturnValue(scoreCheck);
	scoreCheck.limit.mockResolvedValue([]);
	db.query.judgingRounds.findFirst.mockResolvedValue(panelRound);
	db.query.judgingTables.findMany.mockResolvedValue([
		{ id: tableA },
		{ id: tableB }
	]);
	db.query.user.findMany.mockResolvedValue(
		Array.from({ length: 4 }, (_, index) => ({ id: `judge-${index}` }))
	);
	db.query.organization.findMany.mockResolvedValue(
		Array.from({ length: 6 }, (_, index) => ({ id: `team-${index}` }))
	);
});

const settings = {
	roundId,
	panelSize: 2,
	changeoverMinutes: 2,
	breakMinutes: 10,
	maxBlockMinutes: 50
};

describe("judgingTables", () => {
	it("keeps the schedule generator admin-only", async () => {
		await expect(
			judgingTablesRouter
				.createCaller(context("judge"))
				.generateSchedule(settings)
		).rejects.toMatchObject({ code: "FORBIDDEN" });
	});

	it("previews the computed schedule without writing", async () => {
		const preview = await judgingTablesRouter
			.createCaller(context())
			.previewSchedule(settings);
		expect(preview).toMatchObject({
			judgeCount: 4,
			teamCount: 6,
			result: { ok: true, schedule: { presentationMinutes: 10, waveCount: 3 } }
		});
		expect(db.insert).not.toHaveBeenCalled();
	});

	it("requires confirmation before regenerating a published round", async () => {
		db.query.judgingRounds.findFirst.mockResolvedValue({
			...panelRound,
			publishedAt: new Date()
		});
		const api = judgingTablesRouter.createCaller(context());
		await expect(api.generateSchedule(settings)).rejects.toMatchObject({
			code: "CONFLICT"
		});
		expect(db.delete).not.toHaveBeenCalled();

		write.returning.mockResolvedValue([
			{ id: tableA, tableNumber: 1 },
			{ id: tableB, tableNumber: 2 }
		]);
		await api.generateSchedule({ ...settings, confirm: true });
		expect(db.delete).toHaveBeenCalledOnce();
		expect(write.set).toHaveBeenCalledWith(
			expect.objectContaining({ panelSize: 2, presentationMinutes: 10 })
		);
	});

	it("reports schedules that don't fit without writing", async () => {
		await expect(
			judgingTablesRouter
				.createCaller(context())
				.generateSchedule({ ...settings, panelSize: 3 })
		).rejects.toMatchObject({
			code: "BAD_REQUEST",
			message: expect.stringContaining("need at least 6 judges")
		});
		expect(db.delete).not.toHaveBeenCalled();
	});

	it("won't remove a team that has already been scored", async () => {
		db.query.judgingAssignments.findMany.mockResolvedValue([
			{ id: "assignment", scores: [{ id: "score" }] }
		]);
		await expect(
			judgingTablesRouter
				.createCaller(context())
				.removeTeam({ roundId, teamId: "team-1" })
		).rejects.toMatchObject({ code: "CONFLICT" });
		expect(db.delete).not.toHaveBeenCalled();
	});

	describe("adding a late team", () => {
		const slots = {
			first: { tableId: tableB, tableNumber: 2, startsAt: start },
			second: {
				tableId: tableA,
				tableNumber: 1,
				startsAt: addMinutes(start, 10)
			}
		};

		beforeEach(() => {
			db.query.judgingTables.findMany.mockResolvedValue([
				{ id: tableA, tableNumber: 1 },
				{ id: tableB, tableNumber: 2 }
			]);
			db.query.organization.findFirst.mockResolvedValue({
				id: "late-team",
				prescreenStatus: "passed"
			});
			db.query.judgingAssignments.findMany.mockResolvedValue([
				{ teamId: "team-1", tableId: tableA, startsAt: start },
				{ teamId: "team-1", tableId: tableB, startsAt: addMinutes(start, 10) }
			]);
		});

		it("previews back-to-back free slots at different tables", async () => {
			await expect(
				judgingTablesRouter
					.createCaller(context())
					.previewLateTeamSlots({ roundId })
			).resolves.toEqual(slots);
			expect(db.insert).not.toHaveBeenCalled();
		});

		it("adds the team to the previewed slots", async () => {
			await expect(
				judgingTablesRouter
					.createCaller(context())
					.addTeam({ roundId, teamId: "late-team", ...slots })
			).resolves.toEqual(slots);
			expect(write.values).toHaveBeenCalledWith([
				{ teamId: "late-team", tableId: tableB, startsAt: start },
				{
					teamId: "late-team",
					tableId: tableA,
					startsAt: addMinutes(start, 10)
				}
			]);
		});

		it("refuses slots that are no longer the next free pair", async () => {
			await expect(
				judgingTablesRouter.createCaller(context()).addTeam({
					roundId,
					teamId: "late-team",
					first: { tableId: tableA, startsAt: addMinutes(start, 20) },
					second: { tableId: tableB, startsAt: addMinutes(start, 30) }
				})
			).rejects.toMatchObject({ code: "CONFLICT" });
			expect(db.insert).not.toHaveBeenCalled();
		});

		it("skips slots that start before the team could arrive", async () => {
			vi.useFakeTimers({ toFake: ["Date"] });
			vi.setSystemTime(addMinutes(start, 5));
			try {
				// The free 0 and 10 slots are past or inside the arrival buffer.
				await expect(
					judgingTablesRouter
						.createCaller(context())
						.previewLateTeamSlots({ roundId })
				).resolves.toMatchObject({
					first: { startsAt: addMinutes(start, 20) },
					second: { startsAt: addMinutes(start, 30) }
				});
			} finally {
				vi.useRealTimers();
			}
		});
	});

	it("only moves judges to tables in the same round", async () => {
		db.query.user.findFirst.mockResolvedValue({ role: "judge" });
		await expect(
			judgingTablesRouter.createCaller(context()).assignJudge({
				roundId,
				judgeId: "judge-1",
				tableId: "44444444-4444-4444-8444-444444444444"
			})
		).rejects.toMatchObject({ code: "BAD_REQUEST" });
		expect(db.delete).not.toHaveBeenCalled();
	});

	describe("moving a seated judge", () => {
		const seatAtTableA = (judgeIds: string[]) =>
			db.query.judgingTableJudges.findFirst.mockResolvedValue({
				tableId: tableA,
				judgeId: "judge-1",
				table: {
					tableNumber: 3,
					judges: judgeIds.map((judgeId) => ({ judgeId }))
				}
			});
		const move = (tableId: string | null) =>
			judgingTablesRouter
				.createCaller(context())
				.assignJudge({ roundId, judgeId: "judge-1", tableId });

		beforeEach(() => {
			db.query.user.findFirst.mockResolvedValue({ role: "judge" });
		});

		it("keeps a judge who has scored at their table", async () => {
			seatAtTableA(["judge-1", "judge-2"]);
			scoreCheck.limit.mockResolvedValue([{ id: "score" }]);
			await expect(move(tableB)).rejects.toMatchObject({
				code: "BAD_REQUEST",
				message:
					"This judge has already scored teams at Table 3, so they can’t move."
			});
			expect(db.delete).not.toHaveBeenCalled();
		});

		it("never leaves a table without judges", async () => {
			seatAtTableA(["judge-1"]);
			await expect(move(null)).rejects.toMatchObject({
				code: "BAD_REQUEST",
				message:
					"This judge is the only one at Table 3. Move another judge there first."
			});
			expect(db.delete).not.toHaveBeenCalled();
		});

		it("moves a judge who hasn't scored from a shared table", async () => {
			seatAtTableA(["judge-1", "judge-2"]);
			await move(tableB);
			expect(db.delete).toHaveBeenCalledOnce();
			expect(write.values).toHaveBeenCalledWith({
				tableId: tableB,
				judgeId: "judge-1"
			});
		});
	});
});

describe("judgingRounds.publish", () => {
	it("refuses to publish a round without a schedule", async () => {
		db.query.judgingTables.findFirst.mockResolvedValue(undefined);
		await expect(
			judgingRoundsRouter.createCaller(context()).publish({ id: roundId })
		).rejects.toMatchObject({ code: "BAD_REQUEST" });
		expect(db.update).not.toHaveBeenCalled();
	});
});

describe("judgingAssignments.getMine", () => {
	it("returns only published rounds, grouped with table numbers", async () => {
		db.query.member.findFirst.mockResolvedValue({ organizationId: "team-1" });
		const round = (id: string, publishedAt: Date | null) => ({
			id,
			name: id,
			kind: "panel",
			startTime: start,
			presentationMinutes: 8,
			publishedAt
		});
		const published = round("published", new Date());
		db.query.judgingAssignments.findMany.mockResolvedValue([
			{
				id: "a1",
				startsAt: start,
				table: { tableNumber: 3, round: published }
			},
			{
				id: "a2",
				startsAt: addMinutes(start, 10),
				table: { tableNumber: 5, round: published }
			},
			{
				id: "a3",
				startsAt: start,
				table: { tableNumber: 1, round: round("draft", null) }
			}
		]);
		expect(
			await judgingAssignmentsRouter
				.createCaller(context("participant"))
				.getMine()
		).toEqual([
			{
				round: published,
				assignments: [
					{ id: "a1", tableNumber: 3, startsAt: start },
					{ id: "a2", tableNumber: 5, startsAt: addMinutes(start, 10) }
				]
			}
		]);
	});
});
