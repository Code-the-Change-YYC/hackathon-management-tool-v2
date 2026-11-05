import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/server/db", () => ({ db: {} }));
vi.mock("@/server/better-auth", () => ({ auth: { api: {} } }));

import { judgingProgressRouter } from "@/server/api/routers/judging-progress";

const start = new Date("2026-11-08T17:00:00Z");
const db = {
	query: {
		hackathonSettings: { findFirst: vi.fn() },
		judgingRounds: { findFirst: vi.fn(), findMany: vi.fn() },
		judgingAssignments: { findMany: vi.fn() },
		organization: { findFirst: vi.fn() },
		member: { findFirst: vi.fn() }
	},
	execute: vi.fn()
};
const caller = () =>
	judgingProgressRouter.createCaller({
		db,
		session: { user: { id: "participant-1", role: "participant" } },
		headers: new Headers()
	} as never);

beforeEach(() => {
	vi.resetAllMocks();
});

describe("judgingProgress.get", () => {
	it("returns the rounds and completes pre-screening from team decisions", async () => {
		db.query.hackathonSettings.findFirst.mockResolvedValue({
			startDate: null,
			submissionDeadline: start,
			scoresReleased: true
		});
		const round = {
			id: "panel",
			name: "Panel Round",
			kind: "panel",
			startTime: start,
			endTime: start
		};
		db.query.judgingRounds.findMany.mockResolvedValue([round]);
		// Some team exists, and none is still pending.
		db.query.organization.findFirst
			.mockResolvedValueOnce({ id: "team-1" })
			.mockResolvedValueOnce(undefined);

		expect(await caller().get()).toEqual({
			startDate: null,
			submissionDeadline: start,
			prescreenComplete: true,
			rounds: [round],
			scoresReleased: true
		});
	});
	it("keeps pre-screening open while a team is pending", async () => {
		db.query.judgingRounds.findMany.mockResolvedValue([]);
		db.query.organization.findFirst.mockResolvedValue({ id: "team-1" });
		expect(await caller().get()).toMatchObject({
			prescreenComplete: false,
			scoresReleased: false
		});
	});
});

describe("judgingProgress.getMine", () => {
	const published = {
		id: "panel",
		name: "Panel Round",
		kind: "panel",
		startTime: start,
		presentationMinutes: 6,
		publishedAt: start
	};

	it("returns no team for participants without one", async () => {
		db.query.member.findFirst.mockResolvedValue(undefined);
		db.query.judgingRounds.findFirst.mockResolvedValue({ id: "final" });
		expect(await caller().getMine()).toEqual({
			team: null,
			rounds: [],
			finalPublished: true
		});
	});
	it("marks a round scored once every presentation is scored", async () => {
		db.query.member.findFirst.mockResolvedValue({ organizationId: "team-1" });
		db.query.organization.findFirst.mockResolvedValue({
			name: "Team Rocket",
			prescreenStatus: "passed",
			prescreenComments: "Internal note"
		});
		db.query.judgingAssignments.findMany.mockResolvedValue([
			{
				id: "a1",
				startsAt: start,
				table: { tableNumber: 3, round: published }
			},
			{ id: "a2", startsAt: start, table: { tableNumber: 5, round: published } }
		]);
		db.execute.mockResolvedValue([
			{ assignmentId: "a1", roundId: "panel", scored: true },
			{ assignmentId: "a2", roundId: "panel", scored: false }
		]);

		const status = await caller().getMine();
		expect(status.team).toEqual({
			name: "Team Rocket",
			prescreen: "passed",
			feedback: null
		});
		expect(status.rounds).toMatchObject([{ round: published, scored: false }]);
		expect(status.finalPublished).toBe(false);
	});
	it("only shares pre-screening feedback with teams that failed", async () => {
		db.query.member.findFirst.mockResolvedValue({ organizationId: "team-1" });
		db.query.organization.findFirst.mockResolvedValue({
			name: "Team Rocket",
			prescreenStatus: "failed",
			prescreenComments: "The demo video is missing."
		});
		db.query.judgingAssignments.findMany.mockResolvedValue([]);
		db.execute.mockResolvedValue([]);
		expect((await caller().getMine()).team?.feedback).toBe(
			"The demo video is missing."
		);
	});
});
