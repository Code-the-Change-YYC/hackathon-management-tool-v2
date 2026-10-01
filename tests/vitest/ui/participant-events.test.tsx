import { act, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { EventBanner } from "@/app/components/participant/EventBanner";
import {
	JudgingStatus,
	SubmissionCountdown
} from "@/app/components/participant/ParticipantStatus";
import {
	countdownParts,
	type DashboardEvent,
	eventNavigationUrlSchema,
	selectDashboardEvents
} from "@/lib/participant-events";
import { EventType } from "@/types/types";

const now = new Date("2026-11-08T18:00:00Z");
function event(id: string, start: number, end: number): DashboardEvent {
	return {
		id,
		title: id,
		description: "An activity",
		type: EventType.ACTIVITY,
		startTime: new Date(now.getTime() + start * 60_000),
		endTime: new Date(now.getTime() + end * 60_000),
		location: "ENG 224",
		navigationUrl: "https://example.com/directions"
	};
}
afterEach(() => vi.useRealTimers());

describe("shared participant event and status components", () => {
	it("chooses an ongoing event deterministically, excludes ended events, and sorts at most three upcoming events without mutating data", () => {
		const events = [
			event("later", 30, 60),
			event("ended", -60, 0),
			event("overlap", -10, 10),
			event("current", -20, 20),
			event("next", 10, 20),
			event("third", 40, 50),
			event("fourth", 50, 60)
		];
		const result = selectDashboardEvents(events, now);
		expect(result.current?.id).toBe("current");
		expect(result.upcoming.map((item) => item.id)).toEqual([
			"next",
			"later",
			"third"
		]);
		expect(events[0]?.id).toBe("later");
		expect(
			selectDashboardEvents([event("starts", 0, 10)], now).current?.id
		).toBe("starts");
		expect(selectDashboardEvents([], now)).toEqual({
			current: undefined,
			upcoming: []
		});
	});
	it("calculates a multi-day countdown and clamps elapsed deadlines", () => {
		expect(countdownParts(new Date(now.getTime() + 90_061_000), now)).toEqual([
			1, 1, 1, 1
		]);
		expect(countdownParts(new Date(now.getTime() - 1), now)).toEqual([
			0, 0, 0, 0
		]);
	});
	it("updates each second, switches from opening to closing, and stops at zero", () => {
		vi.useFakeTimers();
		vi.setSystemTime(now);
		render(
			<SubmissionCountdown
				deadline={new Date(now.getTime() + 3000)}
				startDate={new Date(now.getTime() + 1000)}
				timeZone="America/Edmonton"
			/>
		);
		expect(screen.getByText("Time until submission opens")).toBeInTheDocument();
		act(() => vi.advanceTimersByTime(1000));
		expect(
			screen.getByText("Time until submission closes")
		).toBeInTheDocument();
		expect(screen.getByRole("timer")).toHaveAttribute(
			"aria-label",
			"0 days, 0 hours, 0 minutes, 2 seconds remaining"
		);
		act(() => vi.advanceTimersByTime(2000));
		expect(
			screen.getByRole("heading", { name: "Submissions closed" })
		).toBeInTheDocument();
	});
	it("only renders an actionable banner link for safe URLs", () => {
		expect(
			eventNavigationUrlSchema.safeParse("javascript:alert(1)").success
		).toBe(false);
		expect(eventNavigationUrlSchema.safeParse("not a URL").success).toBe(false);
		const current = event("Trivia", -5, 5);
		const { rerender } = render(<EventBanner event={current} timeZone="UTC" />);
		expect(
			screen.getByRole("link", { name: "Navigate there" })
		).toHaveAttribute("href", current.navigationUrl);
		rerender(
			<EventBanner event={{ ...current, navigationUrl: null }} timeZone="UTC" />
		);
		expect(screen.queryByRole("link")).not.toBeInTheDocument();
	});
	it("keeps the banner slot with placeholder copy when no current event exists", () => {
		render(<EventBanner timeZone="UTC" />);
		expect(
			screen.getByRole("heading", { name: "Hackathon updates coming soon" })
		).toBeInTheDocument();
		expect(
			screen.getByText(
				"We’re getting the next event ready. Check back soon for schedule details."
			)
		).toBeInTheDocument();
		expect(
			screen.queryByRole("link", { name: "Navigate there" })
		).not.toBeInTheDocument();
	});
	it("uses the configured phase and active round, rather than wall-clock time", () => {
		const { rerender } = render(
			<JudgingStatus phase="judging" roundName="Final round" />
		);
		expect(screen.getByText("Judging: Final round")).toBeInTheDocument();
		expect(screen.getByText("Judging: current").closest("li")).toHaveAttribute(
			"aria-current",
			"step"
		);
		rerender(<JudgingStatus phase="winners_announced" />);
		expect(
			screen.getByText("Winners announced: current").closest("li")
		).toHaveAttribute("aria-current", "step");
	});
});
