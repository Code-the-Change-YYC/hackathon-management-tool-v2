import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type {
	Criterion,
	JudgeAssignment
} from "@/app/components/judge/judgePortal";
import { ScoreView } from "@/app/components/judge/score/ScoreView";

const mocks = vi.hoisted(() => ({
	push: vi.fn(),
	confirm: vi.fn(),
	mutate: vi.fn()
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: mocks.push }) }));
vi.mock("@/app/components/ConfirmAlertDialog", () => ({
	ConfirmAlertDialog: () => null,
	useConfirmDialog: () => ({ confirm: mocks.confirm, dialogProps: {} })
}));
vi.mock("@/trpc/react", () => ({
	api: {
		scores: {
			createMany: { useMutation: () => ({ mutateAsync: mocks.mutate }) }
		}
	}
}));
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
function assignment(
	id = "assignment-a",
	scores: { criteriaId: string; value: number }[] = []
) {
	return {
		id,
		team: { id: "team", name: id, teamCode: "TEAM" },
		room: { roundId: "round", round: { id: "round", name: "Round 1" } },
		timeSlot: null,
		scores
	} as unknown as JudgeAssignment;
}
function scoreView(
	item: JudgeAssignment = assignment(),
	criteria: Criterion[] = [main, sidepot] as Criterion[]
) {
	return <ScoreView assignment={item} criteria={criteria} key={item.id} />;
}
beforeEach(() => {
	vi.resetAllMocks();
	mocks.confirm.mockResolvedValue(true);
	mocks.mutate.mockResolvedValue([]);
});
function review() {
	fireEvent.click(screen.getByRole("button", { name: "Next" }));
	fireEvent.click(screen.getByRole("button", { name: "Review scores" }));
}
describe("judge scoring flow", () => {
	it("only shows and submits criteria for the assignment's round", async () => {
		render(
			scoreView(
				assignment("assignment-a", [{ criteriaId: "final", value: 9 }]),
				[
					{ ...main, roundIds: ["round"] },
					{
						...main,
						id: "final",
						name: "Final round only",
						roundIds: ["final"]
					},
					sidepot
				] as Criterion[]
			)
		);
		expect(screen.queryByText("Final round only")).not.toBeInTheDocument();
		fireEvent.click(screen.getByRole("radio", { name: "8 out of 10" }));
		review();
		expect(
			screen.getAllByRole("status", { name: "Main score total" })[0]
		).toHaveTextContent("8");
		fireEvent.click(screen.getByRole("button", { name: "Submit scores" }));
		await waitFor(() => expect(mocks.push).toHaveBeenCalledWith("/judge"));
		expect(mocks.mutate).toHaveBeenCalledExactlyOnceWith([
			{ assignmentId: "assignment-a", criteriaId: "main", score: 8 }
		]);
	});
	it("requires a main score, allows an unscored sidepot, and submits only selected scores", async () => {
		render(scoreView());
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
		render(scoreView());
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
		render(scoreView());
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
		const { rerender } = render(
			scoreView(assignment("assignment-a", [{ criteriaId: "main", value: 4 }]))
		);
		expect(screen.getByRole("radio", { name: "4 out of 10" })).toBeChecked();
		fireEvent.click(screen.getByRole("radio", { name: "9 out of 10" }));
		rerender(scoreView(assignment("assignment-b")));
		expect(
			screen.getByRole("radio", { name: "9 out of 10" })
		).not.toBeChecked();
	});
	it("confirms discarding edits when leaving through the breadcrumb", async () => {
		mocks.confirm.mockResolvedValue(false);
		render(scoreView());
		fireEvent.click(screen.getByRole("radio", { name: "8 out of 10" }));
		fireEvent.click(screen.getByRole("link", { name: "Dashboard" }));
		await waitFor(() => expect(mocks.confirm).toHaveBeenCalled());
		expect(mocks.push).not.toHaveBeenCalled();
	});
});
