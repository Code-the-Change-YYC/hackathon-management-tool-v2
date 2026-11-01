import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CriterionDialog } from "@/app/components/admin/judging/CriterionDialog";
import type { Criterion } from "@/app/components/admin/judging/judgingShared";
import { judgingRound } from "../helpers/judging";

const mocks = vi.hoisted(() => ({ create: vi.fn(), update: vi.fn() }));
vi.mock("@/hooks/use-refresh", () => ({
	useRefresh: () => ({ isRefreshing: false, refresh: vi.fn() })
}));
vi.mock("@/trpc/react", () => ({
	api: {
		criteria: {
			create: {
				useMutation: () => ({ mutate: mocks.create, isPending: false })
			},
			update: {
				useMutation: () => ({ mutate: mocks.update, isPending: false })
			}
		}
	}
}));

const criterion: Criterion = {
	id: "criterion",
	name: "Impact",
	description: "How much it matters",
	displayOrder: 2,
	roundIds: [],
	maxScore: 5,
	isSidepot: false
};

function renderDialog(existing?: Criterion) {
	return render(
		<CriterionDialog
			criterion={existing}
			nextDisplayOrder={4}
			onClose={vi.fn()}
			rounds={[judgingRound()]}
		/>
	);
}

function change(label: string, value: string) {
	const input = screen.getByLabelText(label);
	fireEvent.change(input, { target: { value } });
	fireEvent.blur(input);
}

beforeEach(() => vi.clearAllMocks());

describe("criterion dialog", () => {
	it("adds a sidepot with its description, order and maximum", async () => {
		renderDialog();
		expect(screen.getByLabelText("Display order")).toHaveValue("4");
		change("Name", "  Best UI  ");
		change("Description (optional)", "  Polish and clarity  ");
		fireEvent.click(screen.getByRole("checkbox", { name: /Sidepot/ }));
		change("Maximum score", "10");
		change("Display order", "7");
		fireEvent.click(screen.getByRole("button", { name: "Add criterion" }));
		await waitFor(() =>
			expect(mocks.create).toHaveBeenCalledWith({
				name: "Best UI",
				description: "Polish and clarity",
				displayOrder: 7,
				isSidepot: true,
				maxScore: 10,
				roundIds: []
			})
		);
	});

	it("loads an existing criterion and keeps main criteria out of 5", async () => {
		renderDialog(criterion);
		expect(screen.getByLabelText("Description (optional)")).toHaveValue(
			"How much it matters"
		);
		expect(screen.getByLabelText("Display order")).toHaveValue("2");
		expect(screen.getByLabelText("Maximum score")).toBeDisabled();
		expect(screen.getByText("Fixed for main criteria.")).toBeInTheDocument();
		change("Display order", "0");
		fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
		await waitFor(() =>
			expect(mocks.update).toHaveBeenCalledWith(
				expect.objectContaining({
					id: "criterion",
					displayOrder: 0,
					maxScore: 5
				})
			)
		);
	});

	it("says when saving resets an older main criterion's maximum", () => {
		renderDialog({ ...criterion, maxScore: 10 });
		expect(
			screen.getByText("Now out of 10. Saving changes it to 5.")
		).toBeInTheDocument();
	});

	it("needs a display order", async () => {
		renderDialog(criterion);
		change("Display order", "");
		fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
		expect(await screen.findByText("Enter a number.")).toBeInTheDocument();
		expect(mocks.update).not.toHaveBeenCalled();
	});
});
