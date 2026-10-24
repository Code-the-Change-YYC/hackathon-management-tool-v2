import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ComponentProps } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ControlsView } from "@/app/components/admin/controls/ControlsView";
import { RESET_CONFIRMATION_PHRASE } from "@/lib/constants";

const mocks = vi.hoisted(() => ({
	update: vi.fn(),
	reset: vi.fn(),
	settings: null as null | { startDate: Date; endDate: Date }
}));

vi.mock("@/hooks/use-refresh", () => ({
	useRefresh: () => ({ isRefreshing: false, refresh: vi.fn() })
}));
vi.mock("@/trpc/react", () => ({
	api: {
		hackathonSettings: {
			update: {
				useMutation: () => ({ mutate: mocks.update, isPending: false })
			},
			resetHackathon: {
				useMutation: () => ({ mutate: mocks.reset, isPending: false })
			}
		}
	}
}));

function renderControls() {
	const settings = mocks.settings as ComponentProps<
		typeof ControlsView
	>["settings"];
	render(<ControlsView settings={settings} />);
}

const submit = () => screen.getByRole("button", { name: "Submit Changes" });

function change(label: string, value: string) {
	fireEvent.change(screen.getByLabelText(label), { target: { value } });
}

beforeEach(() => {
	vi.clearAllMocks();
	mocks.settings = null;
});

describe("admin controls", () => {
	it("leaves scoring criteria to the judging page", () => {
		renderControls();
		expect(
			screen.queryByText("Set Scoring Categories")
		).not.toBeInTheDocument();
		expect(submit()).toBeDisabled();
	});

	it("creates the hackathon with valid dates and keeps saved times", async () => {
		mocks.settings = {
			startDate: new Date("2026-11-07T15:00:00Z"),
			endDate: new Date("2026-11-08T23:00:00Z")
		};
		renderControls();
		expect(screen.getByLabelText("Start Date")).toBeDisabled();

		fireEvent.click(screen.getByRole("radio", { name: "Create hackathon" }));
		change("End Date", "2026-11-06");
		expect(
			screen.getByText("The end date must be after the start date.")
		).toBeInTheDocument();
		expect(submit()).toBeDisabled();

		change("Start Date", "2026-11-14");
		change("End Date", "2026-11-15");
		fireEvent.click(submit());
		await waitFor(() =>
			expect(mocks.update).toHaveBeenCalledWith({
				startDate: new Date("2026-11-14T09:00:00-06:00"),
				endDate: new Date("2026-11-15T17:00:00-06:00"),
				isActive: true
			})
		);
	});

	it("needs a selection and the phrase before resetting", async () => {
		renderControls();
		fireEvent.click(screen.getByRole("radio", { name: "Reset hackathon" }));
		change(
			`Enter “${RESET_CONFIRMATION_PHRASE}” to confirm reset`,
			RESET_CONFIRMATION_PHRASE
		);
		expect(submit()).toBeDisabled();

		fireEvent.click(screen.getByRole("checkbox", { name: /Reset Teams/ }));
		expect(
			screen.getByRole("checkbox", { name: /Reset Scores/ })
		).toBeChecked();
		expect(
			screen.getByText("Included with teams or rooms")
		).toBeInTheDocument();

		fireEvent.click(submit());
		await waitFor(() =>
			expect(mocks.reset).toHaveBeenCalledWith({
				users: false,
				teams: true,
				rooms: false,
				scores: true,
				confirmation: RESET_CONFIRMATION_PHRASE
			})
		);
	});

	it("rejects the wrong phrase and clears choices when switching action", () => {
		renderControls();
		fireEvent.click(screen.getByRole("radio", { name: "Reset hackathon" }));
		fireEvent.click(screen.getByRole("checkbox", { name: /Reset Users/ }));
		change(
			`Enter “${RESET_CONFIRMATION_PHRASE}” to confirm reset`,
			"i love code"
		);
		expect(submit()).toBeDisabled();

		fireEvent.click(screen.getByRole("radio", { name: "Create hackathon" }));
		fireEvent.click(screen.getByRole("radio", { name: "Reset hackathon" }));
		expect(
			screen.getByRole("checkbox", { name: /Reset Users/ })
		).not.toBeChecked();
	});
});
