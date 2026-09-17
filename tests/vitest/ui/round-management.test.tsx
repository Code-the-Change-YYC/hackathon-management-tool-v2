import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RoundManagement } from "@/app/components/admin/judging/RoundManagement";

const mocks = vi.hoisted(() => ({
	create: vi.fn(),
	update: vi.fn(),
	invalidate: vi.fn().mockResolvedValue(undefined),
	rounds: [] as Array<{
		id: string;
		name: string;
		startTime: Date;
		endTime: Date;
	}>,
	pending: false
}));
vi.mock("@/trpc/react", () => ({
	api: {
		useUtils: () => ({
			judgingRounds: { getAll: { invalidate: mocks.invalidate } },
			hackathonSettings: { get: { invalidate: mocks.invalidate } },
			judgingRooms: { getLayoutByRound: { invalidate: mocks.invalidate } },
			judgingAssignments: {
				getAll: { invalidate: mocks.invalidate },
				getByRound: { invalidate: mocks.invalidate }
			}
		}),
		judgingRounds: {
			getAll: { useQuery: () => ({ data: mocks.rounds }) },
			create: {
				useMutation: () => ({ mutate: mocks.create, isPending: mocks.pending })
			},
			update: {
				useMutation: () => ({ mutate: mocks.update, isPending: false })
			},
			delete: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) }
		},
		hackathonSettings: {
			get: { useQuery: () => ({ data: { currentRoundId: null } }) },
			update: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) }
		},
		judgingAssignments: { getAll: { useQuery: () => ({ data: [] }) } }
	}
}));

function fillRound(end = "2026-09-12T12:00") {
	fireEvent.change(screen.getByLabelText("Round name"), {
		target: { value: "  Finals  " }
	});
	fireEvent.change(screen.getByLabelText("Starts"), {
		target: { value: "2026-09-12T10:00" }
	});
	fireEvent.change(screen.getByLabelText("Ends"), { target: { value: end } });
}
beforeEach(() => {
	vi.clearAllMocks();
	mocks.rounds = [];
	mocks.pending = false;
});
describe("judging round form", () => {
	it("validates the time range and submits trimmed values", async () => {
		render(<RoundManagement onSelectRound={vi.fn()} selectedRoundId="" />);
		fillRound("2026-09-12T09:00");
		fireEvent.click(screen.getByRole("button", { name: "Add round" }));
		expect(
			await screen.findByText("End time must be after start time.")
		).toBeInTheDocument();
		expect(mocks.create).not.toHaveBeenCalled();
		fireEvent.change(screen.getByLabelText("Ends"), {
			target: { value: "2026-09-12T12:00" }
		});
		fireEvent.click(screen.getByRole("button", { name: "Add round" }));
		await waitFor(() =>
			expect(mocks.create).toHaveBeenCalledWith({
				name: "Finals",
				startTime: new Date("2026-09-12T10:00"),
				endTime: new Date("2026-09-12T12:00")
			})
		);
	});
	it("loads existing values for editing and resets on cancel", async () => {
		mocks.rounds = [
			{
				id: "round-1",
				name: "Existing round",
				startTime: new Date("2026-09-12T10:00"),
				endTime: new Date("2026-09-12T12:00")
			}
		];
		render(
			<RoundManagement onSelectRound={vi.fn()} selectedRoundId="round-1" />
		);
		fireEvent.click(screen.getByRole("button", { name: "Edit" }));
		expect(screen.getByLabelText("Round name")).toHaveValue("Existing round");
		fireEvent.change(screen.getByLabelText("Round name"), {
			target: { value: "Renamed round" }
		});
		fireEvent.click(screen.getByRole("button", { name: "Save round" }));
		await waitFor(() =>
			expect(mocks.update).toHaveBeenCalledWith(
				expect.objectContaining({ id: "round-1", name: "Renamed round" })
			)
		);
		fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
		expect(screen.getByLabelText("Round name")).toHaveValue("");
		expect(screen.getByLabelText("Starts")).toHaveValue("");
		expect(
			screen.getByRole("button", { name: "Add round" })
		).toBeInTheDocument();
	});
	it("does not submit while a creation is pending", async () => {
		mocks.pending = true;
		render(<RoundManagement onSelectRound={vi.fn()} selectedRoundId="" />);
		fillRound();
		expect(screen.getByRole("button", { name: "Add round" })).toBeDisabled();
		fireEvent.submit(
			screen
				.getByRole("button", { name: "Add round" })
				.closest("form") as HTMLFormElement
		);
		await waitFor(() => expect(mocks.create).not.toHaveBeenCalled());
	});
});
