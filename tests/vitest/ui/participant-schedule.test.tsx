import { act, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ScheduleView } from "@/app/components/participant/schedule/ScheduleView";
import { groupScheduleItemsByDate } from "@/app/components/Schedule";
import type { DashboardEvent } from "@/lib/participant-events";
import { EventType } from "@/types/types";

const now = new Date("2026-11-07T20:00:00Z");
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
		render(<ScheduleView events={events} />);
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
			screen.getByRole("button", { name: "Navigate there" })
		).toHaveAttribute("href", "https://example.com/directions");
	});
	it("transitions from upcoming to ongoing to completed without a page reload", () => {
		vi.useFakeTimers();
		vi.setSystemTime(now);
		render(
			<ScheduleView events={[event("Trivia", EventType.ACTIVITY, 0.5, 1)]} />
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
	it("groups events by Calgary day", () => {
		const item = (id: string, date: string) => ({
			...event(id, EventType.FOOD, 0, 1),
			startTime: new Date(date)
		});
		const groups = groupScheduleItemsByDate([
			item("previous day", "2025-11-02T05:30:00Z"),
			item("earlier", "2025-11-02T07:30:00Z"),
			item("later", "2025-11-02T08:30:00Z")
		]);
		expect(groups.map((group) => group.label)).toEqual([
			"Saturday, November 1",
			"Sunday, November 2"
		]);
		expect(groups[1]?.items.map((item) => item.id)).toEqual([
			"earlier",
			"later"
		]);
	});
	it("renders Calgary times and omits unsafe navigation links", () => {
		vi.useFakeTimers();
		vi.setSystemTime(now);
		const current = {
			...event("Trivia", EventType.ACTIVITY, 0, 60),
			location: null,
			navigationUrl: "javascript:alert(1)"
		};
		render(<ScheduleView events={[current]} />);
		expect(
			within(screen.getByRole("listitem")).getByText("2:00 PM – 3:00 PM")
		).toBeInTheDocument();
		expect(screen.getByText("Location TBA")).toBeInTheDocument();
		expect(
			screen.queryByRole("button", { name: "Navigate there" })
		).not.toBeInTheDocument();
	});
	it("shows an empty state when nothing is scheduled", () => {
		render(<ScheduleView events={[]} />);
		expect(
			screen.getByText("No events have been scheduled yet")
		).toBeInTheDocument();
	});
});
