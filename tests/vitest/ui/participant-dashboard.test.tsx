import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DashboardView } from "@/app/components/participant/ParticipantDashboard";

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
});
