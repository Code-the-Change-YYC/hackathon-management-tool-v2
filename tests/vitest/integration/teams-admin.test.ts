import { beforeEach, describe, expect, it, vi } from "vitest";
import { createCaller } from "@/server/api/root";
import { createTRPCContext } from "@/server/api/trpc";

const mocks = vi.hoisted(() => ({
	execute: vi.fn(),
	findMany: vi.fn(),
	findFirst: vi.fn(),
	findRounds: vi.fn(),
	update: vi.fn(),
	set: vi.fn(),
	where: vi.fn(),
	returning: vi.fn(),
	transaction: vi.fn(),
	txExecute: vi.fn(),
	txDelete: vi.fn(),
	txWhere: vi.fn(),
	txReturning: vi.fn(),
	txLimit: vi.fn(),
	judged: vi.fn(),
	session: vi.fn()
}));

vi.mock("@/server/better-auth", () => ({
	auth: { api: { getSession: mocks.session } }
}));

vi.mock("@/server/db", () => ({
	db: {
		execute: mocks.execute,
		query: {
			organization: {
				findMany: mocks.findMany,
				findFirst: mocks.findFirst
			},
			judgingRounds: { findMany: mocks.findRounds }
		},
		update: mocks.update,
		selectDistinct: () => ({ from: () => ({ where: mocks.judged }) }),
		transaction: mocks.transaction
	}
}));

async function caller(role?: string) {
	mocks.session.mockResolvedValue(
		role
			? { user: { id: "current-user", role }, session: { id: "test-session" } }
			: null
	);
	return createCaller(await createTRPCContext({ headers: new Headers() }));
}

beforeEach(() => {
	vi.resetAllMocks();
	mocks.execute.mockResolvedValue([]);
	mocks.findMany.mockResolvedValue([]);
	mocks.findFirst.mockResolvedValue(undefined);
	mocks.findRounds.mockResolvedValue([]);
	mocks.update.mockReturnValue({ set: mocks.set });
	mocks.set.mockReturnValue({ where: mocks.where });
	mocks.where.mockReturnValue({ returning: mocks.returning });
	mocks.returning.mockResolvedValue([]);
	mocks.txDelete.mockReturnValue({ where: mocks.txWhere });
	mocks.txWhere.mockReturnValue({ returning: mocks.txReturning });
	mocks.txReturning.mockResolvedValue([]);
	mocks.txLimit.mockResolvedValue([]);
	mocks.judged.mockResolvedValue([]);
	mocks.transaction.mockImplementation(
		async (callback: (tx: unknown) => Promise<unknown>) =>
			callback({
				execute: mocks.txExecute,
				delete: mocks.txDelete,
				update: mocks.update,
				select: () => ({
					from: () => ({ where: () => ({ limit: mocks.txLimit }) })
				})
			})
	);
});

describe("admin teams procedures", () => {
	it("restricts every admin procedure to admins", async () => {
		const api = await caller("participant");

		await expect(api.teams.getTeamsWithMembers()).rejects.toMatchObject({
			code: "FORBIDDEN"
		});
		await expect(
			api.teams.setPrescreen({
				teamId: "team-1",
				status: "passed",
				comments: "Looks good"
			})
		).rejects.toMatchObject({ code: "FORBIDDEN" });
		await expect(api.teams.delete({ id: "team-1" })).rejects.toMatchObject({
			code: "FORBIDDEN"
		});

		expect(mocks.findMany).not.toHaveBeenCalled();
		expect(mocks.execute).not.toHaveBeenCalled();
		expect(mocks.transaction).not.toHaveBeenCalled();
	});

	it("returns teams with member names, codes, scoring and finalist status", async () => {
		mocks.findMany.mockResolvedValue([
			{
				id: "team-1",
				name: "Alpha",
				teamCode: "ABC123",
				prescreenStatus: "passed",
				prescreenComments: null,
				members: [
					{ user: { name: "Ada Lovelace", email: "alpha@example.com" } },
					{ user: { name: "Alan Turing", email: "teammate@example.com" } }
				]
			},
			{
				id: "team-2",
				name: "Beta",
				teamCode: null,
				prescreenStatus: "pending",
				prescreenComments: null,
				members: []
			}
		]);
		mocks.findRounds.mockResolvedValue([
			{
				id: "round-1",
				name: "Round 1",
				kind: "panel",
				tables: [
					{
						assignments: [
							{ id: "alpha-1", teamId: "team-1" },
							{ id: "beta-1", teamId: "team-2" }
						]
					},
					{
						assignments: [
							{ id: "beta-2", teamId: "team-2" },
							{ id: "alpha-2", teamId: "team-1" }
						]
					}
				]
			},
			{
				id: "round-2",
				name: "Round 2",
				kind: "panel",
				tables: [{ assignments: [] }]
			},
			{
				id: "final",
				name: "Final Round",
				kind: "final",
				tables: [{ assignments: [{ id: "final-1", teamId: "team-1" }] }]
			}
		]);
		mocks.judged.mockResolvedValue([{ teamId: "team-1" }]);
		// Alpha is scored at both tables; Beta is still missing one.
		mocks.execute.mockResolvedValue(
			[
				["alpha-1", true],
				["alpha-2", true],
				["beta-1", true],
				["beta-2", false]
			].map(([assignmentId, scored]) => ({
				assignmentId,
				roundId: "round-1",
				scored
			}))
		);

		const api = await caller("admin");

		await expect(api.teams.getTeamsWithMembers()).resolves.toEqual({
			rounds: [
				{ id: "round-1", name: "Round 1" },
				{ id: "round-2", name: "Round 2" }
			],
			teams: [
				{
					id: "team-1",
					name: "Alpha",
					teamCode: "ABC123",
					prescreen: "passed",
					feedback: null,
					judged: true,
					members: [
						{ name: "Ada Lovelace", email: "alpha@example.com" },
						{ name: "Alan Turing", email: "teammate@example.com" }
					],
					rounds: { "round-1": true, "round-2": null },
					finalist: true
				},
				{
					id: "team-2",
					name: "Beta",
					teamCode: null,
					prescreen: "pending",
					feedback: null,
					judged: false,
					members: [],
					rounds: { "round-1": false, "round-2": null },
					finalist: false
				}
			]
		});
	});

	it("rejects failing a team without feedback", async () => {
		const api = await caller("admin");

		await expect(
			api.teams.setPrescreen({
				teamId: "team-1",
				status: "failed",
				comments: "   "
			})
		).rejects.toMatchObject({ code: "BAD_REQUEST" });
		expect(mocks.findFirst).not.toHaveBeenCalled();
	});

	it("passes a team without feedback and clears old feedback", async () => {
		mocks.findFirst.mockResolvedValue({ id: "team-1", name: "Alpha" });
		mocks.returning.mockResolvedValue([{ id: "team-1" }]);
		const api = await caller("admin");

		await api.teams.setPrescreen({ teamId: "team-1", status: "passed" });
		expect(mocks.set).toHaveBeenCalledWith(
			expect.objectContaining({
				prescreenStatus: "passed",
				prescreenComments: null
			})
		);
	});

	it("returns not found when prescreening an unknown team", async () => {
		const api = await caller("admin");

		await expect(
			api.teams.setPrescreen({
				teamId: "missing-team",
				status: "passed",
				comments: "Reviewed"
			})
		).rejects.toMatchObject({ code: "NOT_FOUND" });
		expect(mocks.txDelete).not.toHaveBeenCalled();
	});

	it("saves a prescreen result with the current admin and timestamp", async () => {
		const existingTeam = { id: "team-1", name: "Alpha" };
		const updatedTeam = {
			...existingTeam,
			prescreenStatus: "failed",
			prescreenComments: "Missing a working demo",
			prescreenedBy: "current-user"
		};
		mocks.findFirst.mockResolvedValue(existingTeam);
		mocks.returning.mockResolvedValue([updatedTeam]);

		const api = await caller("admin");

		await expect(
			api.teams.setPrescreen({
				teamId: "team-1",
				status: "failed",
				comments: "  Missing a working demo  "
			})
		).resolves.toEqual({ ...updatedTeam, removedSlots: 0 });
		expect(mocks.set).toHaveBeenCalledWith(
			expect.objectContaining({
				prescreenStatus: "failed",
				prescreenComments: "Missing a working demo",
				prescreenedBy: "current-user",
				prescreenedAt: expect.any(Date)
			})
		);
		expect(mocks.returning).toHaveBeenCalledOnce();
	});

	it("deletes an existing team inside a transaction", async () => {
		mocks.txReturning.mockResolvedValue([{ id: "team-1" }]);
		const api = await caller("admin");

		await expect(api.teams.delete({ id: "team-1" })).resolves.toEqual({
			success: true,
			id: "team-1"
		});
		expect(mocks.transaction).toHaveBeenCalledOnce();
		expect(mocks.txExecute).toHaveBeenCalledOnce();
		// Its assignments and members go first, then the team.
		expect(mocks.txDelete).toHaveBeenCalledTimes(3);
		expect(mocks.txReturning).toHaveBeenCalledOnce();
	});

	it("refuses to delete a team with judging scores or votes", async () => {
		mocks.txLimit.mockResolvedValue([{ id: "scored-assignment" }]);
		const api = await caller("admin");

		await expect(api.teams.delete({ id: "team-1" })).rejects.toMatchObject({
			code: "CONFLICT",
			message:
				"This team has judging scores or final-round votes, so it can’t be deleted."
		});
		expect(mocks.txDelete).not.toHaveBeenCalled();
	});

	it("returns not found when deleting an unknown team", async () => {
		const api = await caller("admin");

		await expect(
			api.teams.delete({ id: "missing-team" })
		).rejects.toMatchObject({
			code: "NOT_FOUND"
		});
	});
});
