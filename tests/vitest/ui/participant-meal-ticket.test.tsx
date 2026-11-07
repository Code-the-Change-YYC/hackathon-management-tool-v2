import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MealTicket } from "@/app/components/participant/meals/MealTicket";
import { EventTicketStatus, EventType } from "@/types/types";

vi.mock("@/app/components/participant/meals/StyledQRCode", () => ({
	StyledQRCode: ({ value }: { value: string }) => (
		<div data-testid="meal-qr-code">{value}</div>
	)
}));

const ticket = {
	status: EventTicketStatus.ACTIVE,
	token: "ticket-token",
	event: {
		id: "meal-1",
		title: "Lunch",
		type: EventType.FOOD,
		startTime: new Date("2099-01-01T17:00:00Z"),
		endTime: new Date("2099-01-01T18:00:00Z")
	}
} as const;

function renderTicket(teamCode: string | null) {
	return render(
		<MealTicket
			displayName="Meal Participant"
			isAdmin={false}
			meal={null}
			mealPreference={true}
			teamCode={teamCode}
			ticket={ticket}
		/>
	);
}

describe("participant meal ticket team code", () => {
	it("shows the team code above an active QR code", () => {
		renderTicket("ABC123");

		expect(screen.getByText("ABC123")).toBeVisible();
		expect(screen.queryByText(/Team ID:/)).not.toBeInTheDocument();
		expect(screen.getByTestId("meal-qr-code")).toBeVisible();
	});

	it("does not show a team label when the code is null", () => {
		renderTicket(null);

		expect(screen.queryByText("ABC123")).not.toBeInTheDocument();
		expect(screen.getByTestId("meal-qr-code")).toBeVisible();
	});
});
