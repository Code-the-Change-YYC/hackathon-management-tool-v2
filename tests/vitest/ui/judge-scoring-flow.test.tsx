import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
	cleanup,
	fireEvent,
	render,
	screen,
	waitFor
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type {
	Criterion,
	JudgeAssignment
} from "@/app/components/judge/judgePortal";
import { ScoreView } from "@/app/components/judge/score/ScoreView";
import { judgeAssignment, judgeTable, judgingRound } from "../helpers/judging";

const mocks = vi.hoisted(() => ({
	portal: vi.fn(),
	saved: vi.fn(),
	submit: vi.fn(),
	invalidate: vi.fn()
}));
vi.mock("next/navigation", () => ({
	useRouter: () => ({ refresh: mocks.invalidate, push: vi.fn() })
}));
vi.mock("@/trpc/react", async () => {
	const { useQuery, useMutation } = await import("@tanstack/react-query");
	return {
		api: {
			useUtils: () => ({
				scores: { invalidate: mocks.invalidate },
				judgingAssignments: { getByJudge: { invalidate: mocks.invalidate } },
				teams: { getRankings: { invalidate: mocks.invalidate } }
			}),
			scores: {
				getByAssignment: {
					useQuery: () =>
						useQuery({ queryKey: ["scores"], queryFn: mocks.saved })
				},
				createMany: {
					useMutation: () => useMutation({ mutationFn: mocks.submit })
				}
			}
		}
	};
});
const now = new Date("2026-01-01T12:00:00Z");
const criteria: Criterion[] = [
	{
		id: "main",
		name: "Innovation",
		description: "Assess originality and execution.",
		maxScore: 5,
		displayOrder: 0,
		isSidepot: false,
		roundIds: ["round"]
	},
	{
		id: "side",
		name: "Best AI",
		description: "Assess the effective use of AI.",
		maxScore: 5,
		displayOrder: 1,
		isSidepot: true
	}
];
const assignment: JudgeAssignment = judgeAssignment({
	startsAt: now,
	team: { ...judgeAssignment().team, name: "Team One" },
	table: judgeTable({ round: judgingRound({ name: "Preliminary" }) })
});
let client: QueryClient;
function mount() {
	return render(
		<QueryClientProvider client={client}>
			<ScoreView
				assignment={{ ...assignment, scores: mocks.saved() }}
				assignments={[assignment]}
				criteria={mocks.portal().criteria}
				userId="judge-a"
			/>
		</QueryClientProvider>
	);
}
// Picking a score moves on to the next step by itself after a short pause.
async function complete() {
	await screen.findByRole("heading", { name: "Innovation" });
	fireEvent.click(screen.getByRole("button", { name: "4 points" }));
	await screen.findByRole("heading", { name: "Best AI" });
	fireEvent.click(screen.getByRole("button", { name: "0 points" }));
	await screen.findByRole("heading", { name: "Review your scores" });
}
beforeEach(() => {
	vi.resetAllMocks();
	localStorage.clear();
	client = new QueryClient({
		defaultOptions: {
			queries: { retry: false, staleTime: Infinity },
			mutations: { retry: false }
		}
	});
	mocks.portal.mockReturnValue({
		assignments: [assignment],
		criteria,
		isLoading: false,
		error: null
	});
	mocks.saved.mockReturnValue([]);
	mocks.submit.mockResolvedValue([]);
	mocks.invalidate.mockResolvedValue(undefined);
});
afterEach(() => {
	cleanup();
	client.clear();
});

describe("individual judge scoring", () => {
	it("leaves out criteria that belong to another round", async () => {
		mocks.portal.mockReturnValue({
			assignments: [assignment],
			criteria: [
				...criteria,
				{
					...criteria[1],
					id: "final-only",
					name: "Final only",
					roundIds: ["final"]
				}
			],
			isLoading: false,
			error: null
		});
		mount();
		await screen.findByRole("heading", { name: "Innovation" });
		expect(screen.getByText("1 of 2")).toBeInTheDocument();
		expect(screen.queryByText("Final only")).not.toBeInTheDocument();
	});
	it("steps through each criterion, then reviews every score before submitting", async () => {
		mount();
		await complete();
		expect(
			screen.getByRole("button", { name: /Innovation/ })
		).toHaveTextContent("4/5");
		expect(screen.getByRole("button", { name: /Best AI/ })).toHaveTextContent(
			"0/5"
		);
		expect(screen.getByRole("button", { name: "Submit scores" })).toBeEnabled();
		expect(mocks.submit).not.toHaveBeenCalled();
	});
	it("returns to review after changing a score from the review step", async () => {
		mount();
		await complete();
		fireEvent.click(screen.getByRole("button", { name: /Innovation/ }));
		await screen.findByRole("heading", { name: "Innovation" });
		expect(screen.getByRole("button", { name: "4 points" })).toHaveAttribute(
			"aria-pressed",
			"true"
		);
		fireEvent.click(screen.getByRole("button", { name: "2 points" }));
		await screen.findByRole("heading", { name: "Review your scores" });
		expect(
			screen.getByRole("button", { name: /Innovation/ })
		).toHaveTextContent("2/5");
	});
	it("only moves forward once the current criterion is scored", async () => {
		mount();
		await screen.findByRole("heading", { name: "Innovation" });
		expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
		expect(
			screen.queryByRole("button", { name: "Back" })
		).not.toBeInTheDocument();
		fireEvent.click(screen.getByRole("button", { name: "5 points" }));
		expect(screen.getByRole("button", { name: "Next" })).toBeEnabled();
		await screen.findByRole("heading", { name: "Best AI" });
		fireEvent.click(screen.getByRole("button", { name: "Back" }));
		await screen.findByRole("heading", { name: "Innovation" });
		expect(screen.getByRole("button", { name: "5 points" })).toHaveAttribute(
			"aria-pressed",
			"true"
		);
	});
	it("opens a fully scored team on the review step", async () => {
		mocks.saved.mockReturnValue([
			{ criteriaId: "main", value: 5 },
			{ criteriaId: "side", value: 4 }
		]);
		mount();
		await screen.findByRole("heading", { name: "Review your scores" });
		expect(screen.getByRole("button", { name: "Update scores" })).toBeEnabled();
	});
	it("resumes a partly scored team at the first unscored criterion", async () => {
		mocks.saved.mockReturnValue([{ criteriaId: "main", value: 4 }]);
		mount();
		await screen.findByRole("heading", { name: "Best AI" });
		expect(screen.getByText("2 of 2 · Side pot")).toBeInTheDocument();
	});
	it("accepts zero for a side pot", async () => {
		mocks.portal.mockReturnValue({
			assignments: [assignment],
			criteria: criteria.slice(1),
			isLoading: false,
			error: null
		});
		mount();
		await screen.findByRole("heading", { name: "Best AI" });
		fireEvent.click(screen.getByRole("button", { name: "0 points" }));
		await screen.findByRole("heading", { name: "Review your scores" });
		expect(screen.getByRole("button", { name: "Submit scores" })).toBeEnabled();
	});
	it("retains answers and the device draft after failed submission, then retries successfully", async () => {
		mocks.submit.mockRejectedValueOnce(new Error("Network unavailable"));
		mount();
		await complete();
		fireEvent.click(screen.getByRole("button", { name: "Submit scores" }));
		expect(await screen.findByRole("alert")).toHaveTextContent(
			"Network unavailable"
		);
		expect(localStorage.length).toBe(1);
		expect(
			screen.getByRole("button", { name: /Innovation/ })
		).toHaveTextContent("4/5");
		fireEvent.click(screen.getByRole("button", { name: "Submit scores" }));
		await screen.findByText("Scores submitted");
		expect(localStorage.length).toBe(0);
		expect(mocks.submit).toHaveBeenLastCalledWith(
			[
				{ assignmentId: "assignment", criteriaId: "main", score: 4 },
				{ assignmentId: "assignment", criteriaId: "side", score: 0 }
			],
			expect.anything()
		);
	});
	it("prevents duplicate submissions and treats refresh failure as a successful save", async () => {
		let finish!: (value: never[]) => void;
		mocks.submit.mockImplementation(
			() =>
				new Promise((resolve) => {
					finish = resolve;
				})
		);
		mocks.invalidate.mockReturnValue(undefined);
		mount();
		await complete();
		const button = screen.getByRole("button", { name: "Submit scores" });
		fireEvent.click(button);
		fireEvent.click(button);
		await waitFor(() => expect(mocks.submit).toHaveBeenCalledTimes(1));
		expect(screen.getByRole("button", { name: "Submitting…" })).toBeDisabled();
		finish([]);
		await screen.findByText("Scores submitted");
		expect(screen.queryByRole("alert")).not.toBeInTheDocument();
	});
	it("isolates a new judge's form and draft when switching accounts in one query client", async () => {
		const { rerender } = mount();
		await screen.findByRole("heading", { name: "Innovation" });
		fireEvent.click(screen.getByRole("button", { name: "4 points" }));
		rerender(
			<QueryClientProvider client={client}>
				<ScoreView
					assignment={assignment}
					assignments={[assignment]}
					criteria={criteria}
					userId="judge-b"
				/>
			</QueryClientProvider>
		);
		// Judge A's draft would have scored Innovation and skipped past it.
		await screen.findByRole("heading", { name: "Innovation" });
		expect(screen.getByRole("button", { name: "4 points" })).toHaveAttribute(
			"aria-pressed",
			"false"
		);
	});
});
