import { addMinutes } from "date-fns";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/server/db", () => ({ db: {} }));
vi.mock("@/server/better-auth", () => ({ auth: { api: {} } }));

import { finalBallotsRouter } from "@/server/api/routers/final-ballots";

const finalists = ["a", "b", "c", "d", "e"].map(
	(letter) => `${letter.repeat(8)}-aaaa-4aaa-8aaa-${letter.repeat(12)}`
);
const [first, second, third, fourth] = finalists as [
	string,
	string,
	string,
	string
];

function finalRound(overrides: Record<string, unknown> = {}) {
	return {
		id: "final",
		kind: "final",
		startTime: addMinutes(new Date(), -30),
		publishedAt: new Date(),
		tables: [
			{
				judges: [{ judgeId: "judge-a" }, { judgeId: "judge-b" }],
				assignments: finalists.map((id) => ({ id }))
			}
		],
		...overrides
	};
}

const write = {
	where: vi.fn(),
	values: vi.fn(),
	returning: vi.fn()
};
const db = {
	query: {
		judgingRounds: { findFirst: vi.fn() },
		hackathonSettings: { findFirst: vi.fn() }
	},
	insert: vi.fn(),
	delete: vi.fn(),
	transaction: async (run: (tx: unknown) => unknown) => run(db)
};
function caller(id = "judge-a") {
	return finalBallotsRouter.createCaller({
		db,
		session: { user: { id, role: "judge" } },
		headers: new Headers()
	} as never);
}

beforeEach(() => {
	vi.resetAllMocks();
	db.query.judgingRounds.findFirst.mockResolvedValue(finalRound());
	db.query.hackathonSettings.findFirst.mockResolvedValue({
		judgingPhase: "judging"
	});
	db.delete.mockReturnValue(write);
	db.insert.mockReturnValue(write);
	write.values.mockReturnValue(write);
	write.returning.mockResolvedValue([]);
});

describe("final ballots", () => {
	it("replaces the judge's ballot with their picks, from 1st place", async () => {
		await caller().submit({ assignmentIds: [third, first, second] });
		expect(db.delete).toHaveBeenCalledOnce();
		expect(write.values).toHaveBeenCalledWith([
			{ assignmentId: third, judgeId: "judge-a", place: 1 },
			{ assignmentId: first, judgeId: "judge-a", place: 2 },
			{ assignmentId: second, judgeId: "judge-a", place: 3 }
		]);
	});

	it.each([
		["too few picks", [first, second]],
		["too many picks", [first, second, third, fourth]],
		["a repeated pick", [first, first, second]],
		[
			"a team that isn't a finalist",
			[first, second, "ffffffff-ffff-4fff-8fff-ffffffffffff"]
		]
	])("rejects %s", async (_label, assignmentIds) => {
		await expect(caller().submit({ assignmentIds })).rejects.toMatchObject({
			code: "BAD_REQUEST",
			message: "Rank 3 different finalists."
		});
		expect(db.insert).not.toHaveBeenCalled();
	});

	it("ranks every finalist when there are fewer than three", async () => {
		db.query.judgingRounds.findFirst.mockResolvedValue(
			finalRound({
				tables: [
					{
						judges: [{ judgeId: "judge-a" }],
						assignments: [{ id: first }, { id: second }]
					}
				]
			})
		);
		await caller().submit({ assignmentIds: [second, first] });
		expect(write.values).toHaveBeenCalledWith([
			{ assignmentId: second, judgeId: "judge-a", place: 1 },
			{ assignmentId: first, judgeId: "judge-a", place: 2 }
		]);
	});

	it("only lets judges at the published final table vote", async () => {
		await expect(
			caller("outsider").submit({ assignmentIds: [first, second, third] })
		).rejects.toMatchObject({ code: "FORBIDDEN" });
		db.query.judgingRounds.findFirst.mockResolvedValue(
			finalRound({ publishedAt: null })
		);
		await expect(
			caller().submit({ assignmentIds: [first, second, third] })
		).rejects.toMatchObject({ code: "FORBIDDEN" });
		expect(db.insert).not.toHaveBeenCalled();
	});

	it("opens when the final round starts and closes once scores are released", async () => {
		db.query.judgingRounds.findFirst.mockResolvedValue(
			finalRound({ startTime: addMinutes(new Date(), 30) })
		);
		await expect(
			caller().submit({ assignmentIds: [first, second, third] })
		).rejects.toMatchObject({
			code: "FORBIDDEN",
			message: "Ranking opens when the final round starts."
		});

		db.query.judgingRounds.findFirst.mockResolvedValue(finalRound());
		db.query.hackathonSettings.findFirst.mockResolvedValue({
			judgingPhase: "winners_announced"
		});
		await expect(
			caller().submit({ assignmentIds: [first, second, third] })
		).rejects.toMatchObject({
			code: "FORBIDDEN",
			message: "Ranking closed when the winners were announced."
		});
		expect(db.insert).not.toHaveBeenCalled();
	});
});
