import { beforeEach, describe, expect, it, vi } from "vitest";
import { RESET_CONFIRMATION_PHRASE } from "@/lib/constants";
import { createCaller } from "@/server/api/root";
import { createTRPCContext } from "@/server/api/trpc";
import { organization, user } from "@/server/db/auth-schema";
import { judgingRooms, scores } from "@/server/db/schema";

const mocks = vi.hoisted(() => {
	const deleteQuery = { where: vi.fn() };
	return {
		deleteQuery,
		remove: vi.fn(),
		session: vi.fn(),
		transaction: vi.fn()
	};
});

vi.mock("@/server/better-auth", () => ({
	auth: { api: { getSession: mocks.session } }
}));

vi.mock("@/server/db", () => ({
	db: {
		delete: mocks.remove,
		transaction: mocks.transaction
	}
}));

async function caller(role = "admin") {
	mocks.session.mockResolvedValue({
		user: { id: "current-user", role },
		session: { id: "test-session" }
	});
	return createCaller(await createTRPCContext({ headers: new Headers() }));
}

beforeEach(() => {
	vi.resetAllMocks();
	mocks.deleteQuery.where.mockResolvedValue(undefined);
	mocks.remove.mockReturnValue(mocks.deleteQuery);
	mocks.transaction.mockImplementation(async (run: (tx: unknown) => unknown) =>
		run({ delete: mocks.remove })
	);
});

describe("hackathonSettings.resetHackathon", () => {
	it("rejects callers without an admin session", async () => {
		const api = await caller("participant");

		await expect(
			api.hackathonSettings.resetHackathon({
				confirmation: RESET_CONFIRMATION_PHRASE,
				scores: true
			})
		).rejects.toMatchObject({ code: "FORBIDDEN" });
		expect(mocks.transaction).not.toHaveBeenCalled();
	});

	it("rejects an unauthenticated caller", async () => {
		mocks.session.mockResolvedValue(null);
		const api = await createCaller(
			await createTRPCContext({ headers: new Headers() })
		);

		await expect(
			api.hackathonSettings.resetHackathon({
				confirmation: RESET_CONFIRMATION_PHRASE,
				scores: true
			})
		).rejects.toMatchObject({ code: "UNAUTHORIZED" });
		expect(mocks.transaction).not.toHaveBeenCalled();
	});

	it("requires the exact confirmation phrase", async () => {
		const api = await caller();

		await expect(
			api.hackathonSettings.resetHackathon({
				confirmation: "reset everything" as typeof RESET_CONFIRMATION_PHRASE,
				scores: true
			})
		).rejects.toMatchObject({ code: "BAD_REQUEST" });
		expect(mocks.transaction).not.toHaveBeenCalled();
	});

	it("requires at least one reset scope", async () => {
		const api = await caller();

		await expect(
			api.hackathonSettings.resetHackathon({
				confirmation: RESET_CONFIRMATION_PHRASE
			})
		).rejects.toMatchObject({
			code: "BAD_REQUEST"
		});
		expect(mocks.transaction).not.toHaveBeenCalled();
	});

	it("resets all selected tables and returns success", async () => {
		const api = await caller();

		await expect(
			api.hackathonSettings.resetHackathon({
				confirmation: RESET_CONFIRMATION_PHRASE,
				users: true,
				teams: true,
				rooms: true,
				scores: true
			})
		).resolves.toEqual({ success: true });

		expect(mocks.transaction).toHaveBeenCalledOnce();
		expect(mocks.remove).toHaveBeenNthCalledWith(1, scores);
		expect(mocks.remove).toHaveBeenNthCalledWith(2, judgingRooms);
		expect(mocks.remove).toHaveBeenNthCalledWith(3, organization);
		expect(mocks.remove).toHaveBeenNthCalledWith(4, user);
		expect(mocks.deleteQuery.where).toHaveBeenCalledOnce();
	});

	it.each([
		["scores", { scores: true }, [scores]],
		["rooms", { rooms: true }, [scores, judgingRooms]],
		["teams", { teams: true }, [scores, organization]],
		["users", { users: true }, [user]]
	] as const)("resets only the %s scope", async (_scope, selection, tables) => {
		const api = await caller();

		await expect(
			api.hackathonSettings.resetHackathon({
				confirmation: RESET_CONFIRMATION_PHRASE,
				...selection
			})
		).resolves.toEqual({ success: true });

		expect(mocks.remove).toHaveBeenCalledTimes(tables.length);
		for (const [index, table] of tables.entries()) {
			expect(mocks.remove).toHaveBeenNthCalledWith(index + 1, table);
		}
		if ("users" in selection) {
			expect(mocks.deleteQuery.where).toHaveBeenCalledOnce();
		} else {
			expect(mocks.deleteQuery.where).not.toHaveBeenCalled();
		}
	});
});
