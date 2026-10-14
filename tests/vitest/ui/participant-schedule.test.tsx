import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ScheduleView } from "@/app/components/participant/ParticipantSchedule";
import { groupScheduleItemsByDate } from "@/app/components/Schedule";
import type { DashboardEvent } from "@/lib/participant-events";
import { EventType } from "@/types/types";

const now = new Date("2025-11-08T21:00:00Z");
function event(
	id: string,
	type: EventType,
	start: number,
	end: number
): DashboardEvent {
	return {
		id,
		title: id,
		description: `${id} description`,
		type,
		location: "ENG 224",
		navigationUrl: "https://example.com/directions",
		startTime: new Date(now.getTime() + start * 60_000),
		endTime: new Date(now.getTime() + end * 60_000)
	};
}
afterEach(() => vi.useRealTimers());

describe("participant schedule", () => {
	it("lists every event, including completed ones, and shows the current event banner", () => {
		vi.useFakeTimers();
		vi.setSystemTime(now);
		const events = [
			event("Meal", EventType.FOOD, -120, -60),
			event("Opening", EventType.CEREMONY, -20, 30),
			event("Trivia", EventType.ACTIVITY, -10, 20),
			event("Later", EventType.PROJECT, 120, 180)
		];
		render(<ScheduleView events={events} timeZone="America/Edmonton" />);
		expect(
			screen.getByRole("heading", { name: "Opening ongoing now!" })
		).toBeInTheDocument();
		expect(
			screen
				.getAllByRole("listitem")
				.map((item) => within(item).getByRole("heading").textContent)
		).toEqual(["Meal", "Opening", "Trivia", "Later"]);
		expect(screen.getAllByText("Happening now!")).toHaveLength(2);
		expect(screen.getByText("Trivia description")).toBeInTheDocument();
		expect(
			screen.getByRole("link", { name: "Navigate there" })
		).toHaveAttribute("href", "https://example.com/directions");
	});
	it("transitions from upcoming to ongoing to completed without a page reload", () => {
		vi.useFakeTimers();
		vi.setSystemTime(now);
		render(
			<ScheduleView
				events={[event("Trivia", EventType.ACTIVITY, 0.5, 1)]}
				timeZone="UTC"
			/>
		);
		expect(screen.getByText("In 1 min")).toBeInTheDocument();
		expect(
			screen.getByText("Hackathon updates coming soon")
		).toBeInTheDocument();
		act(() => vi.advanceTimersByTime(30_000));
		expect(screen.getByText("Trivia ongoing now!")).toBeInTheDocument();
		expect(screen.getByText("Happening now!")).toBeInTheDocument();
		act(() => vi.advanceTimersByTime(30_000));
		expect(screen.queryByText("Happening now!")).not.toBeInTheDocument();
		expect(
			screen.getByText("Hackathon updates coming soon")
		).toBeInTheDocument();
	});
	it("groups events by day in the hackathon's timezone", () => {
		const item = (id: string, date: string) => ({
			...event(id, EventType.FOOD, 0, 1),
			eventType: EventType.FOOD,
			startTime: new Date(date)
		});
		const groups = groupScheduleItemsByDate(
			[
				item("previous day", "2025-11-02T05:30:00Z"),
				item("earlier", "2025-11-02T07:30:00Z"),
				item("later", "2025-11-02T08:30:00Z")
			],
			"America/Edmonton"
		);
		expect(groups.map((group) => group.label)).toEqual([
			"Saturday, November 1",
			"Sunday, November 2"
		]);
		expect(groups[1]?.items.map((item) => item.id)).toEqual([
			"earlier",
			"later"
		]);
	});
	it("renders timezone-correct times and omits unsafe navigation links", () => {
		vi.useFakeTimers();
		vi.setSystemTime(now);
		const current = {
			...event("Trivia", EventType.ACTIVITY, 0, 60),
			location: null,
			navigationUrl: "javascript:alert(1)"
		};
		render(<ScheduleView events={[current]} timeZone="America/Edmonton" />);
		expect(
			within(screen.getByRole("listitem")).getByText("2:00 PM – 3:00 PM")
		).toBeInTheDocument();
		expect(screen.getByText("Location TBA")).toBeInTheDocument();
		expect(
			screen.queryByRole("link", { name: "Navigate there" })
		).not.toBeInTheDocument();
	});
	it("shows empty, loading, and retryable error states", () => {
		const retry = vi.fn();
		const { rerender } = render(<ScheduleView events={[]} timeZone="UTC" />);
		expect(
			screen.getByText("No events have been scheduled yet.")
		).toBeInTheDocument();
		rerender(<ScheduleView events={[]} loading timeZone="UTC" />);
		expect(screen.getByLabelText("Loading schedule")).toHaveAttribute(
			"aria-busy",
			"true"
		);
		rerender(<ScheduleView error events={[]} retry={retry} timeZone="UTC" />);
		fireEvent.click(screen.getByRole("button", { name: "Try again" }));
		expect(retry).toHaveBeenCalledOnce();
		expect(
			screen.queryByText("No events have been scheduled yet.")
		).not.toBeInTheDocument();
	});
});
