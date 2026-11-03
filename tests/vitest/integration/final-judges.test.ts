import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/server/db", () => ({ db: {} }));
vi.mock("@/server/better-auth", () => ({ auth: { api: {} } }));

import { judgingResultsRouter } from "@/server/api/routers/judging-results";

const tableId = "22222222-2222-4222-8222-222222222222";
const voters = { where: vi.fn() };
const write = {
	where: vi.fn(),
	values: vi.fn(),
	onConflictDoNothing: vi.fn()
};
const db = {
	query: {
		judgingRounds: { findFirst: vi.fn() },
		hackathonSettings: { findFirst: vi.fn() },
		user: { findMany: vi.fn() }
	},
	selectDistinct: () => ({
		from: () => ({ innerJoin: () => voters })
	}),
	delete: vi.fn(),
	insert: vi.fn(),
	transaction: async (run: (tx: unknown) => unknown) => run(db)
};
const seat = (judgeIds: string[]) =>
	judgingResultsRouter
		.createCaller({
			db,
			session: { user: { id: "admin", role: "admin" } },
			headers: new Headers()
		} as never)
		.setFinalJudges({ judgeIds });

beforeEach(() => {
	vi.resetAllMocks();
	db.query.judgingRounds.findFirst.mockResolvedValue({
		id: "final",
		tables: [{ id: tableId }]
	});
	db.query.user.findMany.mockResolvedValue([{ id: "j1" }]);
	voters.where.mockResolvedValue([]);
	db.delete.mockReturnValue(write);
	db.insert.mockReturnValue(write);
	write.values.mockReturnValue(write);
});

describe("judgingResults.setFinalJudges", () => {
	it("replaces the final table's judges", async () => {
		db.query.user.findMany.mockResolvedValue([{ id: "j1" }, { id: "j3" }]);
		await expect(seat(["j1", "j3", "j3"])).resolves.toEqual({
			roundId: "final"
		});
		expect(db.delete).toHaveBeenCalledOnce();
		expect(write.values).toHaveBeenCalledWith([
			{ tableId, judgeId: "j1" },
			{ tableId, judgeId: "j3" }
		]);
	});

	it("keeps judges who have ranked the finalists", async () => {
		voters.where.mockResolvedValue([{ judgeId: "j2" }]);
		await expect(seat(["j1"])).rejects.toMatchObject({
			code: "BAD_REQUEST",
			message:
				"Judges who have ranked the finalists have to stay at the final table."
		});
		expect(db.delete).not.toHaveBeenCalled();
	});

	it("only seats judges", async () => {
		await expect(seat(["j1", "participant"])).rejects.toMatchObject({
			code: "BAD_REQUEST"
		});
		expect(db.delete).not.toHaveBeenCalled();
	});

	it("locks the table once scores are released", async () => {
		db.query.hackathonSettings.findFirst.mockResolvedValue({
			scoresReleased: true
		});
		await expect(seat(["j1"])).rejects.toMatchObject({ code: "FORBIDDEN" });
		expect(db.delete).not.toHaveBeenCalled();
	});

	it("needs finalists first", async () => {
		db.query.judgingRounds.findFirst.mockResolvedValue({
			id: "final",
			tables: []
		});
		await expect(seat(["j1"])).rejects.toMatchObject({
			code: "BAD_REQUEST",
			message: "Pick finalists before seating the final table."
		});
	});
});
