import { beforeEach, describe, expect, it, vi } from "vitest";
import { createCaller } from "@/server/api/root";
import { createTRPCContext } from "@/server/api/trpc";

const mocks = vi.hoisted(() => ({
	execute: vi.fn(),
	findMany: vi.fn(),
	findFirst: vi.fn(),
	update: vi.fn(),
	set: vi.fn(),
	where: vi.fn(),
	returning: vi.fn(),
	transaction: vi.fn(),
	txExecute: vi.fn(),
	txDelete: vi.fn(),
	txWhere: vi.fn(),
	txReturning: vi.fn(),
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
			}
		},
		update: mocks.update,
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
	mocks.update.mockReturnValue({ set: mocks.set });
	mocks.set.mockReturnValue({ where: mocks.where });
	mocks.where.mockReturnValue({ returning: mocks.returning });
	mocks.returning.mockResolvedValue([]);
	mocks.txDelete.mockReturnValue({ where: mocks.txWhere });
	mocks.txWhere.mockReturnValue({ returning: mocks.txReturning });
	mocks.txReturning.mockResolvedValue([]);
	mocks.transaction.mockImplementation(
		async (callback: (tx: unknown) => Promise<unknown>) =>
			callback({
				execute: mocks.txExecute,
				delete: mocks.txDelete
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
		await expect(api.teams.getRankings()).rejects.toMatchObject({
			code: "FORBIDDEN"
		});
		await expect(api.teams.delete({ id: "team-1" })).rejects.toMatchObject({
			code: "FORBIDDEN"
		});

		expect(mocks.findMany).not.toHaveBeenCalled();
		expect(mocks.execute).not.toHaveBeenCalled();
		expect(mocks.transaction).not.toHaveBeenCalled();
	});

	it("returns teams with member emails and ranking positions", async () => {
		mocks.findMany.mockResolvedValue([
			{
				id: "team-1",
				name: "Alpha",
				prescreenStatus: "passed",
				prescreenComments: "Strong submission",
				members: [
					{ user: { email: "alpha@example.com" } },
					{ user: { email: "teammate@example.com" } }
				]
			},
			{
				id: "team-2",
				name: "Beta",
				prescreenStatus: "pending",
				prescreenComments: null,
				members: []
			}
		]);
		mocks.execute.mockResolvedValue([
			{ id: "team-2", name: "Beta", totalScore: 99 },
			{ id: "team-1", name: "Alpha", totalScore: 80 }
		]);

		const api = await caller("admin");

		await expect(api.teams.getTeamsWithMembers()).resolves.toEqual([
			{
				rank: 2,
				id: "team-1",
				name: "Alpha",
				prescreen: "passed",
				feedback: "Strong submission",
				members: "alpha@example.com, teammate@example.com",
				memberCount: 2,
				round1: null,
				round2: null
			},
			{
				rank: 1,
				id: "team-2",
				name: "Beta",
				prescreen: "pending",
				feedback: null,
				members: "",
				memberCount: 0,
				round1: null,
				round2: null
			}
		]);
	});

	it("returns rankings to admins", async () => {
		const rankings = [
			{ id: "team-1", name: "Alpha", totalScore: 80 },
			{ id: "team-2", name: "Beta", totalScore: 75 }
		];
		mocks.execute.mockResolvedValue(rankings);

		const api = await caller("admin");

		await expect(api.teams.getRankings()).resolves.toEqual(rankings);
		expect(mocks.execute).toHaveBeenCalledOnce();
	});

	it("rejects prescreening without comments", async () => {
		const api = await caller("admin");

		await expect(
			api.teams.setPrescreen({
				teamId: "team-1",
				status: "failed",
				comments: ""
			})
		).rejects.toMatchObject({ code: "BAD_REQUEST" });
		expect(mocks.findFirst).not.toHaveBeenCalled();
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
		expect(mocks.update).not.toHaveBeenCalled();
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
		).resolves.toEqual(updatedTeam);
		expect(mocks.set).toHaveBeenCalledWith(
			expect.objectContaining({
				prescreenStatus: "failed",
				prescreenComments: "  Missing a working demo  ",
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
		expect(mocks.txDelete).toHaveBeenCalledOnce();
		expect(mocks.txReturning).toHaveBeenCalledOnce();
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
