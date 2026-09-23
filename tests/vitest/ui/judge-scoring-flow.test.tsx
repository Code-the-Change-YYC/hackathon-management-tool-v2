import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { JudgeScorePage } from "@/app/components/judges/JudgeScorePage";

const mocks = vi.hoisted(() => ({
	push: vi.fn(),
	confirm: vi.fn(),
	mutate: vi.fn(),
	invalidate: vi.fn(),
	portal: vi.fn(),
	query: vi.fn()
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: mocks.push }) }));
vi.mock("@/app/components/ConfirmAlertDialog", () => ({
	ConfirmAlertDialog: () => null,
	useConfirmDialog: () => ({ confirm: mocks.confirm, dialogProps: {} })
}));
vi.mock("@/trpc/react", () => ({
	api: {
		useUtils: () => ({
			scores: {
				getByAssignment: { invalidate: mocks.invalidate },
				getByRound: { invalidate: mocks.invalidate },
				getJudgeTotals: { invalidate: mocks.invalidate }
			},
			judgingAssignments: { getByJudge: { invalidate: mocks.invalidate } }
		}),
		scores: {
			getByAssignment: { useQuery: mocks.query },
			createMany: { useMutation: () => ({ mutateAsync: mocks.mutate }) }
		}
	}
}));
vi.mock(
	"@/app/components/judges/useJudgePortalData",
	async (importOriginal) => ({
		...(await importOriginal<
			typeof import("@/app/components/judges/useJudgePortalData")
		>()),
		useJudgeUser: () => ({ userId: "judge-a" }),
		useJudgePortalData: mocks.portal
	})
);
const main = {
	id: "main",
	name: "Technical",
	description: "Working implementation",
	maxScore: 10,
	isSidepot: false,
	displayOrder: 0
};
const sidepot = {
	...main,
	id: "sidepot",
	name: "Best AI",
	maxScore: 5,
	isSidepot: true
};
function assignment(id = "assignment-a") {
	return {
		id,
		team: { id: "team", name: id, teamCode: "TEAM" },
		room: { round: { id: "round", name: "Round 1" } },
		timeSlot: null,
		scores: []
	};
}
beforeEach(() => {
	vi.resetAllMocks();
	mocks.confirm.mockResolvedValue(true);
	mocks.mutate.mockResolvedValue([]);
	mocks.invalidate.mockResolvedValue(undefined);
	mocks.portal.mockReturnValue({
		assignments: [assignment(), assignment("assignment-b")],
		criteria: [main, sidepot],
		isLoading: false,
		error: null
	});
	mocks.query.mockReturnValue({ data: [], isLoading: false, error: null });
});
function review() {
	fireEvent.click(screen.getByRole("button", { name: "Next" }));
	fireEvent.click(screen.getByRole("button", { name: "Review scores" }));
}
describe("judge scoring flow", () => {
	it("requires a main score, allows an unscored sidepot, and submits only selected scores", async () => {
		render(<JudgeScorePage assignmentId="assignment-a" />);
		expect(screen.getAllByRole("radio")).toHaveLength(10);
		review();
		expect(
			screen.getByRole("button", { name: "Submit scores" })
		).toBeDisabled();
		fireEvent.click(screen.getByRole("button", { name: "Edit Technical" }));
		fireEvent.click(screen.getByRole("radio", { name: "8 out of 10" }));
		review();
		expect(screen.getByText("Best AI: Not scored (optional)")).toBeVisible();
		fireEvent.click(screen.getByRole("button", { name: "Submit scores" }));
		await waitFor(() => expect(mocks.push).toHaveBeenCalledWith("/judge"));
		expect(mocks.mutate).toHaveBeenCalledExactlyOnceWith([
			{ assignmentId: "assignment-a", criteriaId: "main", score: 8 }
		]);
	});
	it("keeps sidepot scores out of the main total and saves a deliberate zero", async () => {
		render(<JudgeScorePage assignmentId="assignment-a" />);
		fireEvent.click(screen.getByRole("radio", { name: "7 out of 10" }));
		fireEvent.click(screen.getByRole("button", { name: "Next" }));
		fireEvent.click(screen.getByRole("radio", { name: "5 out of 5" }));
		expect(
			screen.getByRole("status", { name: "Main score total" })
		).toHaveTextContent("7");
		fireEvent.click(screen.getByRole("radio", { name: "0 out of 5" }));
		fireEvent.click(screen.getByRole("button", { name: "Review scores" }));
		fireEvent.click(screen.getByRole("button", { name: "Submit scores" }));
		await waitFor(() =>
			expect(mocks.mutate).toHaveBeenCalledWith([
				{ assignmentId: "assignment-a", criteriaId: "main", score: 7 },
				{ assignmentId: "assignment-a", criteriaId: "sidepot", score: 0 }
			])
		);
	});
	it("retains edits after a failed submission and allows retry", async () => {
		mocks.mutate.mockRejectedValueOnce(new Error("Connection failed"));
		render(<JudgeScorePage assignmentId="assignment-a" />);
		fireEvent.click(screen.getByRole("radio", { name: "6 out of 10" }));
		review();
		fireEvent.click(screen.getByRole("button", { name: "Submit scores" }));
		expect(await screen.findByRole("alert")).toHaveTextContent(
			"Connection failed"
		);
		expect(mocks.push).not.toHaveBeenCalled();
		fireEvent.click(screen.getByRole("button", { name: "Submit scores" }));
		await waitFor(() => expect(mocks.push).toHaveBeenCalledWith("/judge"));
		expect(mocks.mutate).toHaveBeenCalledTimes(2);
	});
	it("loads existing scores and resets unsaved values when the assignment changes", () => {
		mocks.query.mockReturnValue({
			data: [{ criteriaId: "main", value: 4 }],
			isLoading: false,
			error: null
		});
		const { rerender } = render(<JudgeScorePage assignmentId="assignment-a" />);
		expect(screen.getByRole("radio", { name: "4 out of 10" })).toBeChecked();
		fireEvent.click(screen.getByRole("radio", { name: "9 out of 10" }));
		mocks.query.mockReturnValue({ data: [], isLoading: false, error: null });
		rerender(<JudgeScorePage assignmentId="assignment-b" />);
		expect(
			screen.getByRole("radio", { name: "9 out of 10" })
		).not.toBeChecked();
	});
	it("blocks scoring while saved scores are loading or cannot be fetched", () => {
		mocks.query.mockReturnValue({ isLoading: true, error: null });
		const { rerender } = render(<JudgeScorePage assignmentId="assignment-a" />);
		expect(screen.queryByRole("radio")).not.toBeInTheDocument();
		mocks.query.mockReturnValue({
			isLoading: false,
			error: new Error("Network error")
		});
		rerender(<JudgeScorePage assignmentId="assignment-a" />);
		expect(
			screen.getByRole("heading", { name: "Unable to load scoring" })
		).toBeVisible();
		expect(screen.queryByRole("radio")).not.toBeInTheDocument();
	});
	it("confirms discarding edits when leaving through the breadcrumb", async () => {
		mocks.confirm.mockResolvedValue(false);
		render(<JudgeScorePage assignmentId="assignment-a" />);
		fireEvent.click(screen.getByRole("radio", { name: "8 out of 10" }));
		fireEvent.click(screen.getByRole("link", { name: "Dashboard" }));
		await waitFor(() => expect(mocks.confirm).toHaveBeenCalled());
		expect(mocks.push).not.toHaveBeenCalled();
	});
});
