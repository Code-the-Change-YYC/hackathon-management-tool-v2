import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DashboardView } from "@/app/components/participant/dashboard/DashboardView";
import type { DashboardEvent } from "@/lib/participant-events";
import type { JudgingProgress } from "@/lib/participant-judging";
import { EventType } from "@/types/types";

function ongoingEvent(navigationUrl: string | null): DashboardEvent {
	return {
		id: "trivia",
		title: "Trivia",
		description: "An activity",
		type: EventType.ACTIVITY,
		startTime: new Date(Date.now() - 5 * 60_000),
		endTime: new Date(Date.now() + 5 * 60_000),
		location: "ENG 224",
		navigationUrl
	};
}

const progress: JudgingProgress = {
	startDate: null,
	submissionDeadline: null,
	prescreenComplete: false,
	rounds: [],
	scoresReleased: false
};

describe("participant dashboard page", () => {
	it("shows honest empty and unconfigured states", () => {
		render(
			<DashboardView
				events={[]}
				firstName="Victoria"
				judging={[]}
				needsCheckIn={false}
				progress={progress}
				settings={null}
			/>
		);
		expect(screen.getByText("No upcoming events")).toBeInTheDocument();
		expect(
			screen.getByText("The submission deadline will be announced soon.")
		).toBeInTheDocument();
		expect(
			screen.getByRole("link", { name: "View full schedule" })
		).toHaveAttribute("href", "/participant/schedule");
	});
	it("only shows the current event navigation button for safe URLs", () => {
		const { rerender } = render(
			<DashboardView
				events={[ongoingEvent("https://example.com/directions")]}
				firstName="Victoria"
				judging={[]}
				needsCheckIn={false}
				progress={progress}
				settings={null}
			/>
		);
		expect(
			screen.getByRole("heading", { name: "Trivia ongoing now!" })
		).toBeInTheDocument();
		expect(
			screen.getByRole("link", { name: "Navigate there" })
		).toHaveAttribute("href", "https://example.com/directions");
		rerender(
			<DashboardView
				events={[ongoingEvent("javascript:alert(1)")]}
				firstName="Victoria"
				judging={[]}
				needsCheckIn={false}
				progress={progress}
				settings={null}
			/>
		);
		expect(
			screen.queryByRole("link", { name: "Navigate there" })
		).not.toBeInTheDocument();
	});
	it("keeps the banner slot with placeholder copy when no current event exists", () => {
		render(
			<DashboardView
				events={[]}
				firstName="Victoria"
				judging={[]}
				needsCheckIn={false}
				progress={progress}
				settings={null}
			/>
		);
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
	it("swaps the event banner for check-in on the first day until checked in", () => {
		const firstDay = {
			id: 1,
			isActive: true,
			metadata: null,
			scoresReleased: false,
			startDate: new Date(),
			endDate: null,
			submissionDeadline: null
		};
		const dayTwo = {
			...firstDay,
			startDate: new Date(Date.now() - 24 * 60 * 60_000)
		};
		const view = (needsCheckIn: boolean, settings: typeof firstDay) => (
			<DashboardView
				events={[ongoingEvent(null)]}
				firstName="Victoria"
				judging={[]}
				needsCheckIn={needsCheckIn}
				progress={progress}
				settings={settings}
			/>
		);
		const checkIn = { name: "Check in to the hackathon" };
		const event = { name: "Trivia ongoing now!" };

		const { rerender } = render(view(true, firstDay));
		expect(screen.getByRole("heading", checkIn)).toBeInTheDocument();
		expect(screen.queryByRole("heading", event)).not.toBeInTheDocument();

		rerender(view(false, firstDay));
		expect(screen.queryByRole("heading", checkIn)).not.toBeInTheDocument();
		expect(screen.getByRole("heading", event)).toBeInTheDocument();

		rerender(view(true, dayTwo));
		expect(screen.queryByRole("heading", checkIn)).not.toBeInTheDocument();
		expect(screen.getByRole("heading", event)).toBeInTheDocument();
	});
});
