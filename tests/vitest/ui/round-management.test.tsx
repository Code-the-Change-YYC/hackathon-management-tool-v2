import {
	fireEvent,
	render,
	screen,
	waitFor,
	within
} from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RoundDialog } from "@/app/components/admin/judging/RoundDialog";
import { RoundHeader } from "@/app/components/admin/judging/RoundHeader";
import { judgingRound } from "../helpers/judging";

const mocks = vi.hoisted(() => ({
	create: vi.fn(),
	update: vi.fn(),
	publish: vi.fn(),
	remove: vi.fn(),
	pending: false
}));
vi.mock("@/hooks/use-refresh", () => ({
	useRefresh: () => ({ isRefreshing: false, refresh: vi.fn() })
}));
vi.mock("@/trpc/react", () => ({
	api: {
		judgingRounds: {
			create: {
				useMutation: () => ({ mutate: mocks.create, isPending: mocks.pending })
			},
			update: {
				useMutation: () => ({ mutate: mocks.update, isPending: false })
			},
			publish: {
				useMutation: () => ({ mutate: mocks.publish, isPending: false })
			},
			unpublish: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
			delete: {
				useMutation: () => ({ mutate: mocks.remove, isPending: false })
			}
		},
		hackathonSettings: {
			update: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) }
		}
	}
}));

const hackathonDates = { start: "2026-09-12", end: "2026-09-13" };

function change(label: string, value: string) {
	fireEvent.change(screen.getByLabelText(label), { target: { value } });
}

beforeEach(() => {
	vi.clearAllMocks();
	mocks.pending = false;
});

describe("round dialog", () => {
	it("validates the time range and submits trimmed values in Calgary time", async () => {
		render(<RoundDialog hackathonDates={hackathonDates} onClose={vi.fn()} />);
		change("Name", "  Finals  ");
		fireEvent.click(screen.getByRole("button", { name: /^Date / }));
		fireEvent.click(
			await screen.findByRole("button", { name: /September 12th, 2026/ })
		);
		change("Starts", "10:00");
		change("Ends", "09:00");
		fireEvent.click(screen.getByRole("button", { name: "Add round" }));
		expect(
			await screen.findByText("End time must be after start time.")
		).toBeInTheDocument();
		expect(mocks.create).not.toHaveBeenCalled();

		change("Ends", "12:00");
		fireEvent.click(screen.getByRole("button", { name: "Add round" }));
		await waitFor(() =>
			expect(mocks.create).toHaveBeenCalledWith({
				name: "Finals",
				startTime: new Date("2026-09-12T10:00:00-06:00"),
				endTime: new Date("2026-09-12T12:00:00-06:00")
			})
		);
	});

	it("loads an existing round for editing", async () => {
		render(
			<RoundDialog
				hackathonDates={hackathonDates}
				onClose={vi.fn()}
				round={judgingRound({
					id: "round-1",
					name: "Existing round",
					startTime: new Date("2026-09-12T16:00:00Z"),
					endTime: new Date("2026-09-12T18:00:00Z")
				})}
			/>
		);
		expect(screen.getByLabelText("Name")).toHaveValue("Existing round");
		expect(screen.getByLabelText("Starts")).toHaveValue("10:00");
		expect(screen.getByLabelText("Ends")).toHaveValue("12:00");
		change("Name", "Renamed round");
		fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
		await waitFor(() =>
			expect(mocks.update).toHaveBeenCalledWith(
				expect.objectContaining({ id: "round-1", name: "Renamed round" })
			)
		);
	});

	it("can't submit while a creation is pending", () => {
		mocks.pending = true;
		render(<RoundDialog hackathonDates={hackathonDates} onClose={vi.fn()} />);
		expect(screen.getByRole("button", { name: "Add round" })).toBeDisabled();
	});
});

function renderHeader(props: Partial<Parameters<typeof RoundHeader>[0]> = {}) {
	return render(
		<RoundHeader
			hackathonDates={null}
			hasSchedule
			hasScores={false}
			isCurrent={false}
			round={judgingRound({ publishedAt: null })}
			{...props}
		/>
	);
}

async function openMenu(name = "Round 1") {
	fireEvent.click(screen.getByRole("button", { name: `Manage ${name}` }));
	return screen.findByRole("menu");
}

describe("round header", () => {
	it("shows the publish state and publishes a scheduled round", () => {
		renderHeader();
		expect(screen.getByText("Not published")).toBeInTheDocument();
		fireEvent.click(screen.getByRole("button", { name: "Publish schedule" }));
		expect(mocks.publish).toHaveBeenCalledWith({ id: "round" });
	});

	it("hides publishing until the round has a schedule", () => {
		renderHeader({ hasSchedule: false });
		expect(screen.queryByText("Not published")).not.toBeInTheDocument();
		expect(
			screen.queryByRole("button", { name: "Publish schedule" })
		).not.toBeInTheDocument();
	});

	it("explains why a scored round can't be edited or deleted", async () => {
		renderHeader({ hasScores: true });
		const menu = await openMenu();
		expect(
			within(menu).getByRole("menuitem", { name: "Edit round" })
		).toHaveAttribute("aria-disabled", "true");
		expect(
			within(menu).getByRole("menuitem", { name: "Delete round" })
		).toHaveAttribute("aria-disabled", "true");
		expect(
			within(menu).getByText("Scored rounds can’t be edited or deleted.")
		).toBeInTheDocument();
	});

	it("leaves the final round's times to the finalist picker", async () => {
		renderHeader({
			round: judgingRound({ name: "Final Round", kind: "final" })
		});
		const menu = await openMenu("Final Round");
		expect(
			within(menu).queryByRole("menuitem", { name: "Edit round" })
		).not.toBeInTheDocument();
	});

	it("deletes a round only after confirmation", async () => {
		renderHeader();
		const menu = await openMenu();
		fireEvent.click(
			within(menu).getByRole("menuitem", { name: "Delete round" })
		);
		const dialog = await screen.findByRole("alertdialog");
		expect(mocks.remove).not.toHaveBeenCalled();
		fireEvent.click(
			within(dialog).getByRole("button", { name: "Delete round" })
		);
		await waitFor(() =>
			expect(mocks.remove).toHaveBeenCalledWith({ id: "round" })
		);
	});
});
