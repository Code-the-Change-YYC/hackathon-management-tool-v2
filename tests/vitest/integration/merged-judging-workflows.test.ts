import { getTableConfig } from "drizzle-orm/pg-core";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createCaller } from "@/server/api/root";
import { createTRPCContext } from "@/server/api/trpc";
import { member, organization } from "@/server/db/auth-schema";

// Exercise the real merged routers and schema with database/auth boundaries mocked.
// Live PostgreSQL integration is separate from these regression tests.
const mocks = vi.hoisted(() => {
	const query = {
		member: { findFirst: vi.fn(), findMany: vi.fn() },
		organization: { findFirst: vi.fn(), findMany: vi.fn() },
		judgingAssignments: { findFirst: vi.fn() },
		criteria: { findMany: vi.fn() }
	};
	const write = { set: vi.fn(), where: vi.fn(), returning: vi.fn() };
	const scoreQuery = {
		from: vi.fn(),
		innerJoin: vi.fn(),
		where: vi.fn(),
		limit: vi.fn()
	};
	return {
		query,
		write,
		scoreQuery,
		update: vi.fn(),
		insert: vi.fn(),
		remove: vi.fn(),
		session: vi.fn()
	};
});
vi.mock("@/server/better-auth", () => ({
	auth: { api: { getSession: mocks.session } }
}));
vi.mock("@/server/db", () => {
	const db = {
		query: mocks.query,
		update: mocks.update,
		insert: mocks.insert,
		delete: mocks.remove,
		select: () => mocks.scoreQuery,
		transaction: async (run: (tx: unknown) => unknown) => run(db)
	};
	return { db };
});

async function caller(role = "admin") {
	mocks.session.mockResolvedValue({
		user: { id: "current-user", role },
		session: { id: "test-session" }
	});
	return createCaller(await createTRPCContext({ headers: new Headers() }));
}
beforeEach(() => {
	vi.resetAllMocks();
	mocks.update.mockReturnValue(mocks.write);
	mocks.write.set.mockReturnValue(mocks.write);
	mocks.write.where.mockReturnValue(mocks.write);
	mocks.scoreQuery.from.mockReturnValue(mocks.scoreQuery);
	mocks.scoreQuery.innerJoin.mockReturnValue(mocks.scoreQuery);
	mocks.scoreQuery.where.mockReturnValue(mocks.scoreQuery);
});

describe("merged team and judging workflows", () => {
	it("preserves main's team membership response and owner-first ordering", async () => {
		mocks.query.member.findFirst.mockResolvedValue({
			organizationId: "team-1",
			role: "member"
		});
		mocks.query.organization.findFirst.mockResolvedValue({
			id: "team-1",
			name: "Existing team",
			teamCode: "ABC123",
			prescreenStatus: "passed"
		});
		mocks.query.member.findMany.mockResolvedValue([
			{
				id: "membership-1",
				userId: "current-user",
				role: "member",
				createdAt: new Date(0),
				user: { name: "Member", email: "member@example.com" }
			},
			{
				id: "membership-2",
				userId: "owner",
				role: "owner",
				createdAt: new Date(1),
				user: { name: "Owner", email: "owner@example.com" }
			}
		]);
		const result = await (await caller("participant")).teams.getMyTeam();
		expect(result).toMatchObject({
			id: "team-1",
			name: "Existing team",
			teamCode: "ABC123",
			maxMembers: 5,
			myRole: "member"
		});
		expect(result?.members.map((entry) => entry.role)).toEqual([
			"owner",
			"member"
		]);
		expect(result?.members[1]?.isYou).toBe(true);
		expect(mocks.update).not.toHaveBeenCalled();
	});
	it("preserves main's legacy team-code assignment without replacing prescreen data", async () => {
		mocks.query.member.findFirst.mockResolvedValue({
			organizationId: "team-1",
			role: "owner"
		});
		mocks.query.organization.findFirst.mockResolvedValue({
			id: "team-1",
			name: "Legacy team",
			teamCode: null,
			prescreenStatus: "passed"
		});
		mocks.query.member.findMany.mockResolvedValue([]);
		mocks.write.returning.mockResolvedValue([{ teamCode: "NEW123" }]);
		const result = await (await caller("participant")).teams.getMyTeam();
		expect(result?.teamCode).toBe("NEW123");
		expect(mocks.write.set).toHaveBeenCalledWith({
			teamCode: expect.stringMatching(/^[A-Z0-9]{6}$/)
		});
	});
	it("preserves admin prescreen decisions and rejects repeated decisions", async () => {
		const api = await caller();
		mocks.query.organization.findFirst.mockResolvedValue({
			id: "team-1",
			prescreenStatus: "pending"
		});
		mocks.write.returning.mockResolvedValue([
			{ id: "team-1", prescreenStatus: "passed", teamCode: "ABC123" }
		]);
		await expect(
			api.teams.setPrescreen({
				teamId: "team-1",
				status: "passed",
				comments: "Reviewed submission"
			})
		).resolves.toMatchObject({ prescreenStatus: "passed", teamCode: "ABC123" });
		expect(mocks.write.set).toHaveBeenCalledWith({
			prescreenStatus: "passed",
			prescreenComments: "Reviewed submission",
			prescreenedBy: "current-user",
			prescreenedAt: expect.any(Date)
		});
		mocks.query.organization.findFirst.mockResolvedValue({
			id: "team-1",
			prescreenStatus: "passed"
		});
		await expect(
			api.teams.setPrescreen({
				teamId: "team-1",
				status: "failed",
				comments: "Second review"
			})
		).rejects.toMatchObject({ code: "CONFLICT" });
		expect(mocks.update).toHaveBeenCalledTimes(1);
	});
	it("keeps prescreening admin-only and assignment lookup scoped to the judge", async () => {
		const participant = await caller("participant");
		await expect(
			participant.teams.setPrescreen({
				teamId: "team-1",
				status: "passed",
				comments: "Attempt"
			})
		).rejects.toMatchObject({ code: "FORBIDDEN" });
		const judge = await caller("judge");
		await expect(
			judge.judgingAssignments.getByJudge({ judgeId: "another-judge" })
		).rejects.toMatchObject({ code: "FORBIDDEN" });
		expect(mocks.update).not.toHaveBeenCalled();
	});
	it("retains scored-assignment protection before deleting any room layout", async () => {
		mocks.scoreQuery.limit.mockResolvedValue([{ id: "existing-score" }]);
		const api = await caller();
		await expect(
			api.judgingRooms.saveLayoutByRound({
				roundId: "11111111-1111-4111-8111-111111111111",
				layout: { rooms: [] }
			})
		).rejects.toMatchObject({
			code: "BAD_REQUEST",
			message: expect.stringContaining("has scores")
		});
		expect(mocks.remove).not.toHaveBeenCalled();
	});
	it("rejects scoring by a judge who is not assigned to the room", async () => {
		mocks.query.judgingAssignments.findFirst.mockResolvedValue({
			room: { staff: [{ staffId: "another-judge" }] }
		});
		const api = await caller("judge");
		await expect(
			api.scores.createMany([
				{
					assignmentId: "11111111-1111-4111-8111-111111111111",
					criteriaId: "22222222-2222-4222-8222-222222222222",
					score: 5
				}
			])
		).rejects.toMatchObject({ code: "FORBIDDEN" });
		expect(mocks.insert).not.toHaveBeenCalled();
	});
	it("keeps both the membership uniqueness constraint and prescreen schema", () => {
		const membership = getTableConfig(member);
		expect(
			membership.indexes.some(
				({ config }) => config.name === "member_userId_idx" && config.unique
			)
		).toBe(true);
		const team = getTableConfig(organization);
		expect(
			team.columns.find((column) => column.name === "prescreen_status")
		).toMatchObject({ notNull: true, default: "pending" });
		expect(
			team.foreignKeys.find((key) =>
				key
					.reference()
					.columns.some((column) => column.name === "prescreened_by")
			)?.onDelete
		).toBe("set null");
		expect(
			team.columns.find((column) => column.name === "team_code")?.isUnique
		).toBe(true);
	});
});
