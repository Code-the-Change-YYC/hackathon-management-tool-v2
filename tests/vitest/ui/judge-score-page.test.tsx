import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
	cleanup,
	fireEvent,
	render,
	screen,
	waitFor
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { JudgeScorePage } from "@/app/components/judges/JudgeScorePage";
import { JudgeUserProvider } from "@/app/components/judges/JudgeUserProvider";
import type {
	Criterion,
	JudgeAssignment
} from "@/app/components/judges/judgePortal";

const mocks = vi.hoisted(() => ({
	portal: vi.fn(),
	saved: vi.fn(),
	submit: vi.fn(),
	invalidate: vi.fn()
}));
vi.mock("@/app/components/judges/useJudgePortalData", () => ({
	useJudgePortalData: mocks.portal
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
		maxScore: 10,
		displayOrder: 0,
		isSidepot: false,
		roundIds: ["other-round"]
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
const assignment = {
	id: "assignment",
	timeSlot: now,
	scores: [],
	team: { id: "team", teamCode: "ABCD", name: "Team One" },
	room: { roundId: "round", round: { name: "Preliminary" } }
} as unknown as JudgeAssignment;
let client: QueryClient;
function mount() {
	return render(
		<QueryClientProvider client={client}>
			<JudgeUserProvider userId="judge-a" userName="Dara">
				<JudgeScorePage assignmentId="assignment" />
			</JudgeUserProvider>
		</QueryClientProvider>
	);
}
async function complete() {
	await screen.findByRole("heading", { name: "Innovation" });
	fireEvent.click(screen.getByRole("button", { name: "8 points" }));
	fireEvent.click(screen.getByRole("button", { name: "Next criterion" }));
	await screen.findByRole("heading", { name: "Best AI" });
	fireEvent.click(screen.getByRole("button", { name: "0 points" }));
	fireEvent.click(screen.getByRole("button", { name: "Review scores" }));
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
	mocks.saved.mockResolvedValue([]);
	mocks.submit.mockResolvedValue([]);
	mocks.invalidate.mockResolvedValue(undefined);
});
afterEach(() => {
	cleanup();
	client.clear();
});

describe("individual judge scoring", () => {
	it("shows shared rubric guidance, selected score summaries and a separate review step", async () => {
		mount();
		await complete();
		expect(
			screen.getByRole("heading", { name: "Review your scores" })
		).toBeInTheDocument();
		expect(screen.getByText("8 / 10 points")).toBeInTheDocument();
		expect(screen.getByText("0 / 5 points")).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: "Submit my scores" })
		).toBeEnabled();
		expect(mocks.submit).not.toHaveBeenCalled();
		fireEvent.click(screen.getByRole("button", { name: "Edit Innovation" }));
		expect(screen.getByText("Effective · 7–8 points")).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "8 points" })).toHaveAttribute(
			"aria-pressed",
			"true"
		);
	});
	it("requires every answer, keeps zero distinct, and allows direct navigation", async () => {
		mount();
		await screen.findByRole("heading", { name: "Innovation" });
		fireEvent.click(screen.getByRole("button", { name: "Review" }));
		expect(screen.getAllByText("Not scored yet")).toHaveLength(2);
		expect(
			screen.getByRole("button", { name: "Submit my scores" })
		).toBeDisabled();
		fireEvent.click(screen.getByRole("button", { name: "Edit Best AI" }));
		expect(
			screen.getByText("Assess the effective use of AI.")
		).toBeInTheDocument();
	});
	it("allows clearing a selected score and marks it unanswered again", async () => {
		mount();
		await screen.findByRole("heading", { name: "Innovation" });
		fireEvent.click(screen.getByRole("button", { name: "8 points" }));
		expect(screen.getByRole("button", { name: "8 points" })).toHaveAttribute(
			"aria-pressed",
			"true"
		);
		fireEvent.click(screen.getByRole("button", { name: "8 points" }));
		expect(screen.getByRole("button", { name: "8 points" })).toHaveAttribute(
			"aria-pressed",
			"false"
		);
		expect(screen.getByText("0 of 2 criteria scored")).toBeInTheDocument();
	});

	it("supports side-pot-only scoring without displaying a meaningless main total", async () => {
		mocks.portal.mockReturnValue({
			assignments: [assignment],
			criteria: criteria.slice(1),
			isLoading: false,
			error: null
		});
		mount();
		await screen.findByRole("heading", { name: "Best AI" });
		expect(screen.getByText("Side-pot scoring")).toBeInTheDocument();
		expect(screen.queryByText("Your main score")).not.toBeInTheDocument();
		fireEvent.click(screen.getByRole("button", { name: "0 points" }));
		fireEvent.click(screen.getByRole("button", { name: "Review scores" }));
		expect(
			screen.getByRole("button", { name: "Submit my scores" })
		).toBeEnabled();
	});

	it("always reviews a main-only rubric before submission", async () => {
		mocks.portal.mockReturnValue({
			assignments: [assignment],
			criteria: criteria.slice(0, 1),
			isLoading: false,
			error: null
		});
		mount();
		await screen.findByRole("heading", { name: "Innovation" });
		fireEvent.click(screen.getByRole("button", { name: "5 points" }));
		fireEvent.click(screen.getByRole("button", { name: "Review scores" }));
		expect(
			screen.getByRole("heading", { name: "Review your scores" })
		).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: "Submit my scores" })
		).toBeEnabled();
	});
	it("retains answers and the device draft after failed submission, then retries successfully", async () => {
		mocks.submit.mockRejectedValueOnce(new Error("Network unavailable"));
		mount();
		await complete();
		fireEvent.click(screen.getByRole("button", { name: "Submit my scores" }));
		expect(await screen.findByRole("alert")).toHaveTextContent(
			"Network unavailable"
		);
		expect(localStorage.length).toBe(1);
		expect(screen.getByText("8 / 10 points")).toBeInTheDocument();
		fireEvent.click(screen.getByRole("button", { name: "Submit my scores" }));
		await screen.findByText("Your scores have been submitted");
		expect(localStorage.length).toBe(0);
		expect(mocks.submit).toHaveBeenLastCalledWith(
			[
				{ assignmentId: "assignment", criteriaId: "main", score: 8 },
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
		mocks.invalidate.mockRejectedValue(new Error("Refresh failed"));
		mount();
		await complete();
		const button = screen.getByRole("button", { name: "Submit my scores" });
		fireEvent.click(button);
		fireEvent.click(button);
		await waitFor(() => expect(mocks.submit).toHaveBeenCalledTimes(1));
		expect(
			screen.getByRole("button", { name: "Submitting your scores…" })
		).toBeDisabled();
		finish([]);
		await screen.findByText("Your scores have been submitted");
		expect(screen.queryByRole("alert")).not.toBeInTheDocument();
	});
	it("loads only the judge's saved values for editing and protects them on read failure", async () => {
		mocks.saved.mockResolvedValue([
			{ criteriaId: "main", value: 0 },
			{ criteriaId: "side", value: 4 }
		]);
		mount();
		await screen.findByRole("heading", { name: "Innovation" });
		expect(screen.getByRole("button", { name: "0 points" })).toHaveAttribute(
			"aria-pressed",
			"true"
		);
		fireEvent.click(screen.getByRole("button", { name: "Review" }));
		expect(
			screen.getByRole("button", { name: "Update my scores" })
		).toBeEnabled();
		cleanup();
		client.clear();
		mocks.saved.mockRejectedValue(new Error("Offline"));
		mount();
		await screen.findByText("Your saved scores could not be loaded");
		expect(
			screen.queryByRole("button", { name: "8 points" })
		).not.toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: "Try again" })
		).toBeInTheDocument();
	});
});
