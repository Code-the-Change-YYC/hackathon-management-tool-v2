import {
	act,
	fireEvent,
	render,
	screen,
	waitFor,
	within
} from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { JudgeSchedulePage } from "@/app/components/judges/JudgeSchedulePage";
import type {
	Criterion,
	JudgeAssignment
} from "@/app/components/judges/judgePortal";

const mocks = vi.hoisted(() => ({ useData: vi.fn(), refresh: vi.fn() }));
const now = new Date("2026-09-19T16:00:00Z");
vi.mock("@/hooks/use-current-time", () => ({
	useCurrentTime: () => new Date("2026-09-19T16:00:00Z")
}));
vi.mock("@/app/components/judges/useJudgePortalData", () => ({
	useJudgePortalData: mocks.useData
}));

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
function portalData(overrides = {}) {
	return {
		activeRoundId: round.id,
		assignments: [
			team("Due team"),
			team("Next team", new Date("2026-09-19T16:30:00Z"))
		],
		criteria: [criterion],
		rounds: [round],
		error: null,
		hasData: true,
		isLoading: false,
		isRefreshing: false,
		updatedAt: now.getTime(),
		refresh: mocks.refresh,
		...overrides
	};
}
beforeEach(() => {
	vi.clearAllMocks();
	mocks.refresh.mockResolvedValue(undefined);
	mocks.useData.mockReturnValue(portalData());
});

describe("judge schedule page", () => {
	const finals = {
		...round,
		id: "finals",
		name: "Finals",
		startTime: new Date("2026-09-19T19:00:00Z")
	};
	function finalsTeam() {
		const assignment = team("Finals team", finals.startTime);
		return {
			...assignment,
			room: { ...assignment.room, roundId: finals.id, round: finals }
		};
	}
	function multipleRounds() {
		return portalData({
			rounds: [finals, round],
			assignments: [...portalData().assignments, finalsTeam()]
		});
	}

	it("switches round content and preserves the selection across refreshes and active-round changes", () => {
		mocks.useData.mockReturnValue(multipleRounds());
		const { rerender } = render(<JudgeSchedulePage />);
		fireEvent.click(screen.getByRole("tab", { name: /Finals/ }));
		expect(screen.getByRole("tab", { name: /Finals/ })).toHaveAttribute(
			"aria-selected",
			"true"
		);
		expect(
			screen.getByRole("heading", { name: "Finals team" })
		).toBeInTheDocument();
		expect(
			screen.queryByRole("heading", { name: "Due team" })
		).not.toBeInTheDocument();
		expect(screen.getByText("1 scorecard remaining")).toBeInTheDocument();
		mocks.useData.mockReturnValue({
			...multipleRounds(),
			activeRoundId: "finals",
			isRefreshing: true
		});
		rerender(<JudgeSchedulePage />);
		expect(screen.getByRole("tab", { name: /Finals/ })).toHaveAttribute(
			"aria-selected",
			"true"
		);
		fireEvent.click(screen.getByRole("tab", { name: /Preliminary/ }));
		mocks.useData.mockReturnValue({
			...multipleRounds(),
			activeRoundId: "finals"
		});
		rerender(<JudgeSchedulePage />);
		expect(screen.getByRole("tab", { name: /Preliminary/ })).toHaveAttribute(
			"aria-selected",
			"true"
		);
		expect(
			screen.getByRole("heading", { name: "Due team" })
		).toBeInTheDocument();
	});

	it("supports keyboard navigation between round tabs", async () => {
		mocks.useData.mockReturnValue(multipleRounds());
		render(<JudgeSchedulePage />);
		const preliminary = screen.getByRole("tab", { name: /Preliminary/ });
		act(() => preliminary.focus());
		fireEvent.keyDown(preliminary, { key: "ArrowRight", code: "ArrowRight" });
		await waitFor(() =>
			expect(screen.getByRole("tab", { name: /Finals/ })).toHaveFocus()
		);
		fireEvent.keyDown(screen.getByRole("tab", { name: /Finals/ }), {
			key: "Enter",
			code: "Enter"
		});
		await waitFor(() =>
			expect(screen.getByRole("tab", { name: /Finals/ })).toHaveAttribute(
				"aria-selected",
				"true"
			)
		);
	});

	it("preserves the initially displayed round when an organizer activates another round", () => {
		mocks.useData.mockReturnValue(multipleRounds());
		const { rerender } = render(<JudgeSchedulePage />);
		expect(screen.getByRole("tab", { name: /Preliminary/ })).toHaveAttribute(
			"aria-selected",
			"true"
		);
		mocks.useData.mockReturnValue({
			...multipleRounds(),
			activeRoundId: finals.id
		});
		rerender(<JudgeSchedulePage />);
		expect(screen.getByRole("tab", { name: /Preliminary/ })).toHaveAttribute(
			"aria-selected",
			"true"
		);
		expect(screen.getByRole("tab", { name: /Finals/ })).toHaveTextContent(
			"Active"
		);
	});

	it("shows a per-round empty state and falls back when a selected round is removed", () => {
		mocks.useData.mockReturnValue(portalData({ rounds: [round, finals] }));
		const { rerender } = render(<JudgeSchedulePage />);
		fireEvent.click(screen.getByRole("tab", { name: /Finals/ }));
		expect(
			screen.getByText("You have no assignments in this round.")
		).toBeInTheDocument();
		expect(
			screen.queryByRole("heading", { name: "Due team" })
		).not.toBeInTheDocument();
		mocks.useData.mockReturnValue(portalData());
		rerender(<JudgeSchedulePage />);
		expect(screen.getByRole("tab", { name: /Preliminary/ })).toHaveAttribute(
			"aria-selected",
			"true"
		);
		expect(
			screen.getByRole("heading", { name: "Due team" })
		).toBeInTheDocument();
	});

	it("highlights outstanding work and the next team in the explicitly active round", () => {
		const earlier = team("Earlier round team");
		earlier.room = {
			...earlier.room,
			name: "Room 9",
			roundId: "earlier",
			round: { ...round, id: "earlier", name: "Earlier round" }
		};
		mocks.useData.mockReturnValue(
			portalData({ assignments: [earlier, ...portalData().assignments] })
		);
		render(<JudgeSchedulePage />);
		expect(screen.getByRole("tab", { name: /Preliminary/ })).toHaveAttribute(
			"aria-selected",
			"true"
		);
		expect(screen.getByText("2 scorecards remaining")).toBeInTheDocument();
		expect(
			screen.getByRole("link", { name: "Open scorecard for Due team" })
		).toHaveAttribute("href", "/judge/score/Due team");
		expect(screen.getByText("Next scheduled: Next team")).toBeInTheDocument();
		expect(
			screen.queryByRole("heading", { name: "Earlier round team" })
		).not.toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: "Score team for Next team" })
		).toBeDisabled();
		expect(mocks.useData).toHaveBeenCalledWith({ refetchInterval: 30_000 });
	});

	it("keeps teams without presentation times visible and actionable", () => {
		mocks.useData.mockReturnValue(
			portalData({ assignments: [team("Unscheduled team", null)] })
		);
		render(<JudgeSchedulePage />);
		expect(
			screen.getByRole("heading", { name: "Awaiting scheduling" })
		).toBeInTheDocument();
		expect(
			within(
				screen.getByRole("article", { name: "Unscheduled team · Preliminary" })
			).getByText("Time not assigned")
		).toBeInTheDocument();
		expect(
			screen.getByRole("link", { name: "Score team for Unscheduled team" })
		).toBeInTheDocument();
		expect(
			screen.queryByText("No judging assignments yet")
		).not.toBeInTheDocument();
	});

	it("does not invent an active round when none is configured", () => {
		mocks.useData.mockReturnValue(portalData({ activeRoundId: "" }));
		render(<JudgeSchedulePage />);
		expect(screen.getByText(/No active round selected/)).toBeInTheDocument();
		expect(
			screen.queryByText("Active", { exact: true })
		).not.toBeInTheDocument();
		expect(
			screen.getByRole("heading", { name: "Due team" })
		).toBeInTheDocument();
	});

	it("shows an actionable empty state and an initial loading state", () => {
		mocks.useData.mockReturnValue(portalData({ assignments: [] }));
		const { rerender } = render(<JudgeSchedulePage />);
		expect(screen.getByText("No judging assignments yet")).toBeInTheDocument();
		expect(
			screen.getByText("You have no assignments in this round.")
		).toBeInTheDocument();
		mocks.useData.mockReturnValue(
			portalData({
				hasData: false,
				isLoading: true,
				isRefreshing: true,
				updatedAt: null
			})
		);
		rerender(<JudgeSchedulePage />);
		expect(screen.getByText("Loading schedule…")).toBeInTheDocument();
		expect(
			screen.queryByText("No judging assignments yet")
		).not.toBeInTheDocument();
		expect(screen.getByRole("button", { name: /Refreshing/ })).toBeDisabled();
	});

	it("retains cached assignments after a refresh failure and allows retry", () => {
		mocks.useData.mockReturnValue(
			portalData({ error: new Error("Network failed") })
		);
		const { rerender } = render(<JudgeSchedulePage />);
		expect(
			within(screen.getByRole("alert")).getByText(/may be outdated/)
		).toBeInTheDocument();
		expect(
			screen.getByRole("heading", { name: "Due team" })
		).toBeInTheDocument();
		fireEvent.click(screen.getByRole("button", { name: "Refresh schedule" }));
		expect(mocks.refresh).toHaveBeenCalledOnce();
		mocks.useData.mockReturnValue(portalData({ isRefreshing: true }));
		rerender(<JudgeSchedulePage />);
		expect(screen.getByRole("button", { name: /Refreshing/ })).toBeDisabled();
		mocks.useData.mockReturnValue(
			portalData({
				assignments: [team("Moved team", new Date("2026-09-19T17:00:00Z"))]
			})
		);
		rerender(<JudgeSchedulePage />);
		expect(screen.queryByRole("alert")).not.toBeInTheDocument();
		expect(
			screen.getByRole("heading", { name: "Moved team" })
		).toBeInTheDocument();
		expect(
			screen.queryByRole("heading", { name: "Due team" })
		).not.toBeInTheDocument();
	});

	it("shows a retry instead of an empty schedule when the initial request fails", () => {
		mocks.useData.mockReturnValue(
			portalData({
				error: new Error("Network failed"),
				hasData: false,
				updatedAt: null
			})
		);
		render(<JudgeSchedulePage />);
		expect(
			screen.getByText("Schedule could not be loaded")
		).toBeInTheDocument();
		expect(
			screen.queryByText("No judging assignments yet")
		).not.toBeInTheDocument();
		expect(
			screen.queryByRole("heading", { name: "Due team" })
		).not.toBeInTheDocument();
		fireEvent.click(screen.getByRole("button", { name: "Refresh schedule" }));
		expect(mocks.refresh).toHaveBeenCalledOnce();
	});
});
