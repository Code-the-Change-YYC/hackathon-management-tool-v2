import { beforeEach, describe, expect, it, vi } from "vitest";
import { createCaller } from "@/server/api/root";
import { createTRPCContext } from "@/server/api/trpc";

const mocks = vi.hoisted(() => ({
	execute: vi.fn(),
	session: vi.fn()
}));

vi.mock("@/server/better-auth", () => ({
	auth: { api: { getSession: mocks.session } }
}));

vi.mock("@/server/db", () => ({
	db: { execute: mocks.execute }
}));

const rankings = [{ id: "team-1", name: "Team One", totalScore: "93" }];

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
	mocks.execute.mockResolvedValue(rankings);
});

describe("teams.getRankings", () => {
	it("rejects signed-out visitors", async () => {
		const api = await caller();

		await expect(api.teams.getRankings()).rejects.toMatchObject({
			code: "UNAUTHORIZED"
		});
		expect(mocks.execute).not.toHaveBeenCalled();
	});

	it.each([
		"participant",
		"judge",
		"user"
	])("hides scores from the %s role", async (role) => {
		const api = await caller(role);

		await expect(api.teams.getRankings()).rejects.toMatchObject({
			code: "FORBIDDEN"
		});
		expect(mocks.execute).not.toHaveBeenCalled();
	});

	it("returns every team's total to admins", async () => {
		const api = await caller("admin");

		await expect(api.teams.getRankings()).resolves.toEqual(rankings);
	});
});
