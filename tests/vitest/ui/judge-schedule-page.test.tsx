import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type {
	Criterion,
	JudgeAssignment
} from "@/app/components/judge/judgePortal";
import { ScheduleView } from "@/app/components/judge/schedule/ScheduleView";

const mocks = vi.hoisted(() => ({ refresh: vi.fn() }));
const now = new Date("2026-09-19T16:00:00Z");
vi.mock("@/hooks/use-current-time", () => ({
	useCurrentTime: () => new Date("2026-09-19T16:00:00Z")
}));
vi.mock("next/navigation", () => ({ useRouter: () => mocks }));
const criterion: Criterion = {
	id: "main",
	name: "Innovation",
	description: "",
	displayOrder: 0,
	maxScore: 10,
	isSidepot: false
};
const round = {
	id: "round",
	name: "Preliminary",
	startTime: now,
	endTime: new Date("2026-09-19T18:00:00Z"),
	createdAt: now,
	updatedAt: now
};
function team(id: string, timeSlot: Date | null = now): JudgeAssignment {
	return {
		id,
		teamId: id,
		roomId: "room",
		timeSlot,
		createdAt: now,
		scores: [],
		team: {
			id,
			name: id,
			slug: id,
			logo: null,
			metadata: null,
			createdAt: now,
			teamCode: id,
			prescreenStatus: "passed",
			prescreenComments: null,
			prescreenedBy: null,
			prescreenedAt: null
		},
		room: {
			id: "room",
			name: "Room 2",
			roundId: round.id,
			roomLink: "",
			createdAt: now,
			updatedAt: now,
			round
		}
	};
}

const finals = {
	...round,
	id: "finals",
	name: "Finals",
	startTime: new Date("2026-09-19T19:00:00Z")
};
const finalsTeam = {
	...team("Finals team", finals.startTime),
	room: { ...team("base").room, roundId: finals.id, round: finals }
};
const props = {
	assignments: [
		team("Due team"),
		team("Next team", new Date("2026-09-19T16:30:00Z")),
		finalsTeam
	],
	criteria: [criterion],
	rounds: [finals, round],
	activeRoundId: round.id,
	updatedAt: now.getTime()
};
beforeEach(() => vi.clearAllMocks());

describe("judge round schedule", () => {
	it("shows every round's assignments together in its own card", () => {
		render(<ScheduleView {...props} />);
		const preliminary = screen.getByRole("region", { name: "Preliminary" });
		const finalsCard = screen.getByRole("region", { name: "Finals" });
		expect(
			within(preliminary).getByRole("heading", { name: "Due team" })
		).toBeVisible();
		expect(
			within(finalsCard).getByRole("heading", { name: "Finals team" })
		).toBeVisible();
		expect(within(preliminary).getByText("Active")).toBeVisible();
		expect(within(finalsCard).queryByText("Active")).toBeNull();
		expect(screen.queryByRole("tab")).toBeNull();
	});
	it("keeps unscheduled teams visible and links to the due team's scorecard", () => {
		render(
			<ScheduleView
				{...props}
				assignments={[team("Unscheduled team", null), team("Due team")]}
			/>
		);
		expect(
			screen.getByRole("heading", { name: "Awaiting scheduling" })
		).toBeVisible();
		expect(
			screen.getByRole("link", { name: "Score team for Unscheduled team" })
		).toHaveAttribute("href", "/judge/score/Unscheduled team");
		expect(
			screen.getByRole("link", { name: "Open scorecard for Due team" })
		).toHaveAttribute("href", "/judge/score/Due team");
		expect(screen.getByText("2 scorecards remaining")).toBeVisible();
	});
	it("disables upcoming scorecards", () => {
		const upcoming = team("Upcoming", new Date("2026-09-19T16:30:00Z"));
		render(<ScheduleView {...props} assignments={[upcoming]} />);
		const row = screen.getByRole("article", { name: "Upcoming · Preliminary" });
		expect(
			within(row).getByRole("button", { name: "Score team for Upcoming" })
		).toBeDisabled();
	});
	it("refreshes server data and distinguishes an empty schedule", () => {
		render(<ScheduleView {...props} assignments={[]} rounds={[]} />);
		expect(
			screen.getByText(
				"Your teams will appear here once an organizer assigns them."
			)
		).toBeVisible();
		fireEvent.click(screen.getByRole("button", { name: "Refresh schedule" }));
		expect(mocks.refresh).toHaveBeenCalledOnce();
	});
});
