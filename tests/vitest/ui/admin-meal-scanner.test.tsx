import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Meal from "@/app/components/meal/MealScanner/Meal";
import { formatTime } from "@/lib/datetime";

const checkedInAt = new Date("2026-11-08T18:00:00Z");
const mocks = vi.hoisted(() => ({
	attendees: [] as {
		id: string;
		userId: string;
		userName: string;
		createdAt: Date;
	}[],
	result: {
		status: "checked_in" as "checked_in" | "already_checked_in",
		checkedInAt: new Date("2026-11-08T18:00:00Z"),
		participant: { id: "new", name: "Alex Chen" }
	},
	invalidate: vi.fn(),
	scrollTo: vi.fn(),
	success: vi.fn(),
	info: vi.fn(),
	error: vi.fn()
}));

vi.mock("@yudiel/react-qr-scanner", () => ({
	Scanner: ({
		onScan
	}: {
		onScan: (codes: { rawValue: string }[]) => void;
	}) => (
		<button
			onClick={() => onScan([{ rawValue: `evt1_${"A".repeat(43)}` }])}
			type="button"
		>
			Simulate QR scan
		</button>
	)
}));

vi.mock("sonner", () => ({
	toast: { success: mocks.success, info: mocks.info, error: mocks.error }
}));

vi.mock("@/trpc/react", () => ({
	api: {
		useUtils: () => ({
			events: { getEventAttendees: { invalidate: mocks.invalidate } }
		}),
		events: {
			getEventAttendees: {
				useQuery: () => ({ data: mocks.attendees })
			},
			redeemEventTicket: {
				useMutation: () => ({
					mutate: (
						_input: unknown,
						callbacks: { onSuccess: (result: typeof mocks.result) => void }
					) => callbacks.onSuccess(mocks.result)
				})
			}
		}
	}
}));

beforeEach(() => {
	vi.clearAllMocks();
	mocks.invalidate.mockResolvedValue(undefined);
	mocks.attendees = [
		{ id: "a1", userId: "new", userName: "Alex Chen", createdAt: checkedInAt },
		{ id: "a2", userId: "older", userName: "Sam Patel", createdAt: checkedInAt }
	];
	mocks.result = {
		status: "checked_in",
		checkedInAt,
		participant: { id: "new", name: "Alex Chen" }
	};
	Object.defineProperty(HTMLElement.prototype, "scrollTo", {
		configurable: true,
		value: mocks.scrollTo
	});
});

afterEach(() => {
	Reflect.deleteProperty(HTMLElement.prototype, "scrollTo");
});

describe("admin meal scanner", () => {
	// Given multiple attendees have checked in
	// When I search by part of a name in a different case
	// Then only matching people remain, or an empty search message is shown.
	it("filters attendee names without changing the scanner", () => {
		render(<Meal mealId="meal-1" />);
		const search = screen.getByRole("textbox", {
			name: "Search attendees by name"
		});
		fireEvent.change(search, { target: { value: "  PATEL " } });
		expect(screen.getByText("Sam Patel")).toBeInTheDocument();
		expect(screen.queryByText("Alex Chen")).not.toBeInTheDocument();
		fireEvent.change(search, { target: { value: "nobody" } });
		expect(screen.getByText("No matching attendees.")).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: "Simulate QR scan" })
		).toBeInTheDocument();
	});

	// Given a participant has a new valid ticket and a name filter is active
	// When their QR code is scanned
	// Then the filter is cleared, a named and timed toast appears, and the list scrolls to the top.
	it("shows a new check-in at the top", async () => {
		render(<Meal mealId="meal-1" />);
		fireEvent.change(
			screen.getByRole("textbox", { name: "Search attendees by name" }),
			{
				target: { value: "Sam" }
			}
		);
		fireEvent.click(screen.getByRole("button", { name: "Simulate QR scan" }));
		await waitFor(() =>
			expect(mocks.scrollTo).toHaveBeenCalledWith({
				top: 0,
				behavior: "smooth"
			})
		);
		expect(mocks.success).toHaveBeenCalledWith(
			`Alex Chen checked in at ${formatTime(checkedInAt)}.`
		);
		expect(
			screen.getByRole("textbox", { name: "Search attendees by name" })
		).toHaveValue("");
		expect(screen.getAllByRole("listitem")[0]).toHaveTextContent("Alex Chen");
	});

	// Given a participant already checked in and is lower in the attendee list
	// When their ticket is scanned again
	// Then the original check-in time appears and the list scrolls to that participant.
	it("scrolls to an already checked-in attendee", async () => {
		mocks.result = {
			status: "already_checked_in",
			checkedInAt,
			participant: { id: "older", name: "Sam Patel" }
		};
		render(<Meal mealId="meal-1" />);
		const attendee = screen.getByText("Sam Patel").closest("li");
		const list = attendee?.parentElement?.parentElement;
		if (!attendee || !list)
			throw new Error("Expected a scrollable attendee list");
		list.scrollTop = 40;
		vi.spyOn(list, "getBoundingClientRect").mockReturnValue({
			top: 10
		} as DOMRect);
		vi.spyOn(attendee, "getBoundingClientRect").mockReturnValue({
			top: 110
		} as DOMRect);
		fireEvent.click(screen.getByRole("button", { name: "Simulate QR scan" }));
		await waitFor(() =>
			expect(mocks.scrollTo).toHaveBeenCalledWith({
				top: 140,
				behavior: "smooth"
			})
		);
		expect(mocks.info).toHaveBeenCalledWith(
			`Sam Patel already checked in at ${formatTime(checkedInAt)}.`
		);
	});
});
