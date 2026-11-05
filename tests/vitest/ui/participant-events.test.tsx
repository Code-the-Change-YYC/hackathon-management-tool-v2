import { act, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { JudgingStatus } from "@/app/components/participant/dashboard/JudgingStatus";
import { SubmissionCountdown } from "@/app/components/participant/dashboard/SubmissionCountdown";
import {
	countdownParts,
	type DashboardEvent,
	eventNavigationUrlSchema,
	getCurrentEvent,
	getTodayFutureEvents,
	hasHackathonDayStarted
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
	it("picks the first ongoing event and keeps today's unfinished events", () => {
		const events = [
			event("ended", -60, -30),
			event("current", -20, 20),
			event("overlap", -10, 10),
			event("next", 10, 20),
			event("tomorrow", 24 * 60, 24 * 60 + 30)
		];
		expect(getCurrentEvent(events, now)?.id).toBe("current");
		expect(getCurrentEvent([event("starts", 0, 10)], now)?.id).toBe("starts");
		expect(getCurrentEvent([event("ends", -10, 0)], now)).toBeUndefined();
		expect(getCurrentEvent([], now)).toBeUndefined();
		expect(getTodayFutureEvents(events, now).map((item) => item.id)).toEqual([
			"current",
			"overlap",
			"next"
		]);
	});
	it("decides what counts as today in Calgary, not UTC", () => {
		// 02:00 UTC tomorrow is 7:00 PM today in Calgary.
		const evening = [event("evening", 8 * 60, 9 * 60)];
		expect(getTodayFutureEvents(evening, now)).toEqual(evening);
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
	it("only accepts HTTP(S) navigation URLs", () => {
		expect(
			eventNavigationUrlSchema.safeParse("javascript:alert(1)").success
		).toBe(false);
		expect(eventNavigationUrlSchema.safeParse("not a URL").success).toBe(false);
		expect(
			eventNavigationUrlSchema.safeParse("https://example.com/directions")
				.success
		).toBe(true);
	});
	it("shows the current judging stage from the clock and judging progress", () => {
		const progress = {
			startDate: new Date("2026-11-07T15:00:00Z"),
			submissionDeadline: new Date("2026-11-08T15:00:00Z"),
			prescreenComplete: true,
			rounds: [
				{
					id: "panel",
					name: "Panel Round",
					kind: "panel" as const,
					startTime: new Date("2026-11-08T17:00:00Z"),
					endTime: new Date("2026-11-08T20:00:00Z")
				}
			],
			scoresReleased: false
		};
		const { rerender } = render(
			<JudgingStatus now={now} progress={progress} />
		);
		expect(screen.getByText("Step 3 of 4")).toBeInTheDocument();
		expect(
			screen.getByText("Panel Round: current").closest("li")
		).toHaveAttribute("aria-current", "step");
		rerender(
			<JudgingStatus
				now={new Date("2026-11-08T20:00:00Z")}
				progress={{ ...progress, scoresReleased: true }}
			/>
		);
		expect(screen.getByText("Winners announced")).toBeInTheDocument();
	});
	it("treats the whole Calgary start day as started", () => {
		const kickoff = new Date("2026-11-07T16:00:00Z");
		vi.useFakeTimers();
		vi.setSystemTime(new Date("2026-11-07T05:30:00Z"));
		expect(hasHackathonDayStarted(kickoff)).toBe(false);
		vi.setSystemTime(new Date("2026-11-07T15:00:00Z"));
		expect(hasHackathonDayStarted(kickoff)).toBe(true);
		expect(hasHackathonDayStarted(null)).toBe(false);
	});
});
