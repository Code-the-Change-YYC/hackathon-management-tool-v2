import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DashboardView } from "@/app/components/participant/ParticipantDashboard";
import type { DashboardEvent } from "@/lib/participant-events";
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

describe("participant dashboard page", () => {
	it("shows honest empty/unconfigured states and retryable errors", () => {
		const retry = vi.fn();
		const { rerender } = render(
			<DashboardView events={[]} firstName="Victoria" settings={null} />
		);
		expect(screen.getByText("No upcoming events")).toBeInTheDocument();
		expect(
			screen.getByText("The submission deadline will be announced soon.")
		).toBeInTheDocument();
		expect(
			screen.getByRole("link", { name: "View full schedule" })
		).toHaveAttribute("href", "/participant/schedule");
		rerender(
			<DashboardView
				events={[]}
				eventsError
				firstName="Victoria"
				retryEvents={retry}
				settings={null}
			/>
		);
		fireEvent.click(screen.getByRole("button", { name: "Try again" }));
		expect(retry).toHaveBeenCalledOnce();
	});
	it("only shows the current event navigation button for safe URLs", () => {
		const { rerender } = render(
			<DashboardView
				events={[ongoingEvent("https://example.com/directions")]}
				firstName="Victoria"
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
				settings={null}
			/>
		);
		expect(
			screen.queryByRole("link", { name: "Navigate there" })
		).not.toBeInTheDocument();
	});
	it("keeps the banner slot with placeholder copy when no current event exists", () => {
		render(<DashboardView events={[]} firstName="Victoria" settings={null} />);
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
});
