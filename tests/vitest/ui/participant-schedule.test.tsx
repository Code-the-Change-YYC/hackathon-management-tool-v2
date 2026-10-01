import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ScheduleView } from "@/app/components/participant/ParticipantSchedule";
import {
	groupScheduleItemsByDate,
	ScheduleSection
} from "@/app/components/ScheduleSection";
import type { DashboardEvent } from "@/lib/participant-events";
import { EventType } from "@/types/types";

const now = new Date("2026-11-08T21:00:00Z");
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
	it("keeps all categories and completed events, highlights overlapping ongoing events, and shares the deterministic banner selection", () => {
		vi.useFakeTimers();
		vi.setSystemTime(now);
		const events = [
			event("Later", EventType.PROJECT, 120, 180),
			event("Meal", EventType.FOOD, -120, -60),
			event("Trivia", EventType.ACTIVITY, -10, 20),
			event("Opening", EventType.CEREMONY, -20, 30)
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
		expect(screen.getAllByRole("listitem", { current: true })).toHaveLength(2);
		for (const category of ["Food", "Activity", "Ceremony", "Project"])
			expect(screen.getByText(category)).toBeInTheDocument();
		expect(screen.getByText("Completed")).toBeInTheDocument();
		expect(screen.getByText("In 2 hours")).toBeInTheDocument();
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
		expect(screen.getByRole("listitem", { current: true })).toBeInTheDocument();
		act(() => vi.advanceTimersByTime(30_000));
		expect(screen.getByText("Completed")).toBeInTheDocument();
		expect(
			screen.queryByRole("listitem", { current: true })
		).not.toBeInTheDocument();
		expect(
			screen.getByText("Hackathon updates coming soon")
		).toBeInTheDocument();
	});
	it("groups and sorts by event timezone across midnight and daylight saving without mutating the input", () => {
		const item = (id: string, date: string) => ({
			...event(id, EventType.FOOD, 0, 1),
			eventType: EventType.FOOD,
			startTime: new Date(date)
		});
		const items = [
			item("later", "2026-11-01T08:30:00Z"),
			item("previous day", "2026-11-01T05:30:00Z"),
			item("earlier", "2026-11-01T07:30:00Z")
		];
		const groups = groupScheduleItemsByDate(items, "America/Edmonton");
		expect(groups.map((group) => group.label)).toEqual([
			"Saturday, October 31",
			"Sunday, November 1"
		]);
		expect(groups[1]?.items.map((item) => item.id)).toEqual([
			"earlier",
			"later"
		]);
		expect(items[0]?.id).toBe("later");
	});
	it("renders timezone-correct metadata and omits missing or unsafe navigation links", () => {
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
		expect(screen.queryByRole("link")).not.toBeInTheDocument();
	});
	it("keeps fallback banner copy for empty, loading, and retryable error states", () => {
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
		expect(
			screen.getByText("Hackathon updates coming soon")
		).toBeInTheDocument();
		rerender(<ScheduleView error events={[]} retry={retry} timeZone="UTC" />);
		fireEvent.click(screen.getByRole("button", { name: "Try again" }));
		expect(retry).toHaveBeenCalledOnce();
		expect(
			screen.queryByText("No events have been scheduled yet.")
		).not.toBeInTheDocument();
	});
	it("preserves the meal schedule's default card presentation", () => {
		const meal = event("Breakfast", EventType.FOOD, 0, 60);
		render(
			<ScheduleSection
				emptyDescription="Check back"
				emptyTitle="No meals"
				items={[{ ...meal, eventType: meal.type }]}
				now={now}
				title="Meal Schedule"
			/>
		);
		expect(screen.getByText("Breakfast description")).toBeInTheDocument();
		expect(screen.getByText("Ongoing")).toBeInTheDocument();
		expect(screen.queryByText("ENG 224")).not.toBeInTheDocument();
	});
});
