import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type {
	Criterion,
	JudgeAssignment
} from "@/app/components/judge/judgePortal";
import { ScheduleView } from "@/app/components/judge/schedule/ScheduleView";
import { judgeAssignment, judgeTable, judgingRound } from "../helpers/judging";

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
	maxScore: 5,
	isSidepot: false
};
const round = judgingRound({
	name: "Preliminary",
	startTime: now,
	endTime: new Date("2026-09-19T18:00:00Z")
});
function team(id: string, startsAt: Date = now): JudgeAssignment {
	return judgeAssignment({
		id,
		teamId: id,
		startsAt,
		team: { ...judgeAssignment().team, id, name: id, slug: id, teamCode: id },
		table: judgeTable({ tableNumber: 2, round })
	});
}

const finals = judgingRound({
	id: "finals",
	name: "Finals",
	kind: "final",
	startTime: new Date("2026-09-19T19:00:00Z"),
	endTime: new Date("2026-09-19T20:00:00Z")
});
const finalsTeam = {
	...team("Finals team", finals.startTime),
	table: judgeTable({ id: "finals-table", round: finals })
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
	it("links to the due team's scorecard and shows each team's table", () => {
		render(<ScheduleView {...props} />);
		const preliminary = screen.getByRole("region", { name: "Preliminary" });
		expect(
			within(preliminary).getByRole("link", {
				name: "Open scorecard for Due team"
			})
		).toHaveAttribute("href", "/judge/score/Due team");
		expect(
			within(preliminary).getByText("2 scorecards remaining")
		).toBeVisible();
		expect(within(preliminary).getAllByText("Table 2")).toHaveLength(2);
		const finalsCard = screen.getByRole("region", { name: "Finals" });
		expect(within(finalsCard).getByText("Final table")).toBeVisible();
	});
	it("shows free time between a table's presentations as a break", () => {
		render(
			<ScheduleView
				{...props}
				assignments={[
					team("Due team"),
					team("After break", new Date("2026-09-19T16:30:00Z"))
				]}
			/>
		);
		expect(screen.getByText(/Break until 10:30 AM/)).toBeVisible();
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
