import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RoundManagement } from "@/app/components/admin/judging/RoundManagement";

const mocks = vi.hoisted(() => ({
	create: vi.fn(),
	update: vi.fn(),
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
			delete: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) }
		},
		hackathonSettings: {
			update: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) }
		}
	}
}));
type Round = Parameters<typeof RoundManagement>[0]["rounds"][number];
function renderRounds(rounds: Round[] = []) {
	return render(
		<RoundManagement
			activeRoundId={null}
			assignments={[]}
			onSelectRound={vi.fn()}
			rounds={rounds}
		/>
	);
}

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
	mocks.pending = false;
});
describe("judging round form", () => {
	it("validates the time range and submits trimmed values", async () => {
		renderRounds();
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
				startTime: new Date("2026-09-12T10:00:00-06:00"),
				endTime: new Date("2026-09-12T12:00:00-06:00")
			})
		);
	});
	it("loads existing values for editing and resets on cancel", async () => {
		renderRounds([
			{
				id: "round-1",
				name: "Existing round",
				startTime: new Date("2026-09-12T16:00:00Z"),
				endTime: new Date("2026-09-12T18:00:00Z"),
				createdAt: new Date("2026-09-01T00:00:00Z"),
				updatedAt: new Date("2026-09-01T00:00:00Z")
			}
		]);
		fireEvent.click(screen.getByRole("button", { name: "Edit" }));
		expect(screen.getByLabelText("Round name")).toHaveValue("Existing round");
		expect(screen.getByLabelText("Starts")).toHaveValue("2026-09-12T10:00");
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
		renderRounds();
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
