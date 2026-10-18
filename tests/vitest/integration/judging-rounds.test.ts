import { beforeEach, describe, expect, it, vi } from "vitest";
import { createCaller } from "@/server/api/root";
import { createTRPCContext } from "@/server/api/trpc";

const mocks = vi.hoisted(() => ({
	findMany: vi.fn(),
	session: vi.fn()
}));

vi.mock("@/server/better-auth", () => ({
	auth: { api: { getSession: mocks.session } }
}));

vi.mock("@/server/db", () => ({
	db: { query: { judgingRounds: { findMany: mocks.findMany } } }
}));

const rounds = [{ id: "round-1", name: "Finals" }];

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
	mocks.findMany.mockResolvedValue(rounds);
});

describe("judgingRounds.getAll", () => {
	it("rejects signed-out visitors", async () => {
		const api = await caller();

		await expect(api.judgingRounds.getAll()).rejects.toMatchObject({
			code: "UNAUTHORIZED"
		});
		expect(mocks.findMany).not.toHaveBeenCalled();
	});

	it("returns the rounds to signed-in participants", async () => {
		const api = await caller("participant");

		await expect(api.judgingRounds.getAll()).resolves.toEqual(rounds);
	});
});
