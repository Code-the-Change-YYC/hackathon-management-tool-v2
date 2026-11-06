import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import MealScanner from "@/app/components/admin/meals/MealScanner";
import { formatTime } from "@/lib/datetime";

const checkedInAt = new Date("2026-11-08T18:00:00Z");
const mocks = vi.hoisted(() => ({
	result: {
		status: "checked_in" as "checked_in" | "already_checked_in",
		checkedInAt: new Date("2026-11-08T18:00:00Z"),
		scansUsed: 1,
		scanLimit: 1,
		participant: {
			id: "new",
			name: "Alex Chen",
			dietaryRestrictions: ["halal", "gluten_free"]
		}
	},
	invalidate: vi.fn(),
	success: vi.fn(),
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
	toast: { success: mocks.success, error: mocks.error }
}));

vi.mock("@/trpc/react", () => ({
	api: {
		useUtils: () => ({
			meals: { getMealCheckIns: { invalidate: mocks.invalidate } }
		}),
		events: {
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
	mocks.result = {
		status: "checked_in",
		checkedInAt,
		scansUsed: 1,
		scanLimit: 1,
		participant: {
			id: "new",
			name: "Alex Chen",
			dietaryRestrictions: ["halal", "gluten_free"]
		}
	};
});

describe("admin meal scanner", () => {
	// Given a participant has a new valid ticket
	// When their QR code is scanned
	// Then a named and timed toast appears and the meal check-ins refresh.
	it("announces a new check-in and refreshes check-ins", async () => {
		render(<MealScanner eventId="meal-1" />);
		fireEvent.click(screen.getByRole("button", { name: "Simulate QR scan" }));
		await waitFor(() => expect(mocks.invalidate).toHaveBeenCalled());
		expect(mocks.success).toHaveBeenCalledWith(
			`Alex Chen checked in at ${formatTime(checkedInAt)}. Dietary restrictions: Halal, Gluten-free.`,
			{ duration: 10_000 }
		);
	});

	it("shows the scan allowance on a second successful scan", async () => {
		mocks.result = {
			...mocks.result,
			scansUsed: 2,
			scanLimit: 3
		};
		render(<MealScanner eventId="meal-1" />);
		fireEvent.click(screen.getByRole("button", { name: "Simulate QR scan" }));
		await waitFor(() => expect(mocks.invalidate).toHaveBeenCalled());
		expect(mocks.success).toHaveBeenCalledWith(
			`Alex Chen checked in at ${formatTime(checkedInAt)}. 2 of 3 scans used. Dietary restrictions: Halal, Gluten-free.`,
			{ duration: 10_000 }
		);
	});

	// Given a participant already checked in
	// When their ticket is scanned again
	// Then a red toast shows the original check-in time.
	it("warns about an already checked-in attendee", async () => {
		mocks.result = {
			status: "already_checked_in",
			checkedInAt,
			scansUsed: 1,
			scanLimit: 1,
			participant: { id: "older", name: "Sam Patel", dietaryRestrictions: [] }
		};
		render(<MealScanner eventId="meal-1" />);
		fireEvent.click(screen.getByRole("button", { name: "Simulate QR scan" }));
		await waitFor(() =>
			expect(mocks.error).toHaveBeenCalledWith(
				`Sam Patel already checked in at ${formatTime(checkedInAt)}.`,
				{
					duration: 10_000,
					style: {
						background: "var(--destructive)",
						borderColor: "var(--destructive)",
						color: "var(--primary-foreground)"
					}
				}
			)
		);
	});
});
