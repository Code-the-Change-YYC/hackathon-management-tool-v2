import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/server/db", () => ({ db: {} }));
vi.mock("@/server/better-auth", () => ({ auth: { api: {} } }));

import { teamsRouter } from "@/server/api/routers/teams";

const db = {
	query: {
		member: { findFirst: vi.fn() },
		organization: { findFirst: vi.fn() }
	}
};

const caller = () =>
	teamsRouter.createCaller({
		db,
		session: { user: { id: "participant-1", role: "participant" } },
		headers: new Headers()
	} as never);

beforeEach(() => {
	vi.resetAllMocks();
});

describe("teams.getMyTeamCode", () => {
	it("returns only the signed-in participant's team code", async () => {
		db.query.member.findFirst.mockResolvedValue({ organizationId: "team-1" });
		db.query.organization.findFirst.mockResolvedValue({ teamCode: "ABC123" });

		await expect(caller().getMyTeamCode()).resolves.toBe("ABC123");
		expect(db.query.organization.findFirst).toHaveBeenCalledWith(
			expect.objectContaining({ columns: { teamCode: true } })
		);
	});

	it("returns null without a team membership", async () => {
		db.query.member.findFirst.mockResolvedValue(null);

		await expect(caller().getMyTeamCode()).resolves.toBeNull();
		expect(db.query.organization.findFirst).not.toHaveBeenCalled();
	});

	it("returns null when the team has no code", async () => {
		db.query.member.findFirst.mockResolvedValue({ organizationId: "team-1" });
		db.query.organization.findFirst.mockResolvedValue({ teamCode: null });

		await expect(caller().getMyTeamCode()).resolves.toBeNull();
	});
});
