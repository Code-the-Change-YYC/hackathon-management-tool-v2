import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DashboardView } from "@/app/components/participant/dashboard/DashboardView";
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
	it("shows honest empty and unconfigured states", () => {
		render(
			<DashboardView
				events={[]}
				firstName="Victoria"
				rounds={[]}
				settings={null}
			/>
		);
		expect(screen.getByText("No upcoming events")).toBeInTheDocument();
		expect(
			screen.getByText("The submission deadline will be announced soon.")
		).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: "View full schedule" })
		).toHaveAttribute("href", "/participant/schedule");
	});
	it("only shows the current event navigation button for safe URLs", () => {
		const { rerender } = render(
			<DashboardView
				events={[ongoingEvent("https://example.com/directions")]}
				firstName="Victoria"
				rounds={[]}
				settings={null}
			/>
		);
		expect(
			screen.getByRole("heading", { name: "Trivia ongoing now!" })
		).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: "Navigate there" })
		).toHaveAttribute("href", "https://example.com/directions");
		rerender(
			<DashboardView
				events={[ongoingEvent("javascript:alert(1)")]}
				firstName="Victoria"
				rounds={[]}
				settings={null}
			/>
		);
		expect(
			screen.queryByRole("button", { name: "Navigate there" })
		).not.toBeInTheDocument();
	});
	it("keeps the banner slot with placeholder copy when no current event exists", () => {
		render(
			<DashboardView
				events={[]}
				firstName="Victoria"
				rounds={[]}
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
			screen.queryByRole("button", { name: "Navigate there" })
		).not.toBeInTheDocument();
	});
});
