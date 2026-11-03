import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
	cleanup,
	fireEvent,
	render,
	screen,
	waitFor,
	within
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { JudgeAssignment } from "@/app/components/judge/judgePortal";
import { RankView } from "@/app/components/judge/rank/RankView";
import {
	judgeAssignment,
	judgeTable,
	judgeVote,
	judgingNow,
	judgingRound
} from "../helpers/judging";

const mocks = vi.hoisted(() => ({
	submit: vi.fn(),
	push: vi.fn(),
	toast: vi.fn()
}));
vi.mock("next/navigation", () => ({
	useRouter: () => ({ push: mocks.push })
}));
vi.mock("sonner", () => ({ toast: { success: mocks.toast } }));
vi.mock("@/trpc/react", async () => {
	const { useMutation } = await import("@tanstack/react-query");
	return {
		api: {
			finalBallots: {
				submit: {
					useMutation: () => useMutation({ mutationFn: mocks.submit })
				}
			}
		}
	};
});

const finalTable = judgeTable({
	id: "final-table",
	round: judgingRound({ id: "final", name: "Final Round", kind: "final" })
});
const finalist = (name: string, minutes: number, place?: number) =>
	judgeAssignment({
		id: name,
		startsAt: new Date(judgingNow.getTime() + minutes * 60_000),
		table: finalTable,
		team: { ...judgeAssignment().team, name },
		votes: place ? [judgeVote(name, place)] : []
	});
const finalists = [
	finalist("Aurora", 0),
	finalist("Byte", 12),
	finalist("Cedar", 24),
	finalist("Delta", 36)
];

let client: QueryClient;
function mount(teams: JudgeAssignment[], scoresReleased = false) {
	return render(
		<QueryClientProvider client={client}>
			<RankView finalists={teams} scoresReleased={scoresReleased} />
		</QueryClientProvider>
	);
}
const team = (name: string) =>
	screen.getByRole("button", { name: new RegExp(`^${name}`) });

beforeEach(() => {
	vi.resetAllMocks();
	mocks.submit.mockResolvedValue([]);
	client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
});
afterEach(() => cleanup());

describe("ranking finalists", () => {
	it("gives each tapped team the next open place, then submits in order", async () => {
		mount(finalists);
		expect(
			screen.getByRole("heading", { name: "Rank your top 3" })
		).toBeVisible();
		const review = screen.getByRole("button", { name: "Review ranking" });
		expect(review).toBeDisabled();

		fireEvent.click(team("Cedar"));
		fireEvent.click(team("Aurora"));
		fireEvent.click(team("Delta"));
		expect(team("Cedar")).toHaveAccessibleName("Cedar, 1st place");
		expect(team("Aurora")).toHaveAccessibleName("Aurora, 2nd place");
		// A full ballot ignores more taps until a place is cleared.
		fireEvent.click(team("Byte"));
		expect(team("Byte")).toHaveAttribute("aria-pressed", "false");

		// Clearing 2nd place lets the next tap fill it.
		fireEvent.click(team("Aurora"));
		expect(review).toBeDisabled();
		fireEvent.click(team("Byte"));
		expect(team("Byte")).toHaveAccessibleName("Byte, 2nd place");

		fireEvent.click(review);
		const list = within(
			await screen.findByRole("region", { name: "Review your ranking" })
		).getAllByRole("listitem");
		expect(list.map((item) => item.textContent)).toEqual([
			"1stCedar3 pts",
			"2ndByte2 pts",
			"3rdDelta1 pt"
		]);
		fireEvent.click(screen.getByRole("button", { name: "Submit ranking" }));
		await waitFor(() =>
			expect(mocks.submit.mock.calls[0]?.[0]).toEqual({
				assignmentIds: ["Cedar", "Byte", "Delta"]
			})
		);
		await waitFor(() => expect(mocks.push).toHaveBeenCalledWith("/judge"));
		expect(mocks.toast).toHaveBeenCalledWith("Ranking submitted");
	});

	it("opens a submitted ranking on review so it can be changed", async () => {
		mount([
			finalist("Aurora", 0, 2),
			finalist("Byte", 12, 1),
			finalist("Cedar", 24, 3),
			finalist("Delta", 36)
		]);
		expect(
			screen.getByRole("heading", { name: "Review your ranking" })
		).toBeVisible();
		fireEvent.click(screen.getByRole("button", { name: /1st/ }));
		expect(
			await screen.findByRole("heading", { name: "Rank your top 3" })
		).toBeVisible();
		expect(team("Byte")).toHaveAccessibleName("Byte, 1st place");
		fireEvent.click(screen.getByRole("button", { name: "Review ranking" }));
		expect(
			await screen.findByRole("button", { name: "Update ranking" })
		).toBeEnabled();
	});

	it("keeps the ballot and shows the error when submitting fails", async () => {
		mocks.submit.mockRejectedValue(
			new Error("Ranking closed when the winners were announced.")
		);
		mount([
			finalist("Aurora", 0, 1),
			finalist("Byte", 12, 2),
			finalist("Cedar", 24, 3)
		]);
		fireEvent.click(screen.getByRole("button", { name: "Update ranking" }));
		expect(
			await screen.findByText(/Ranking closed when the winners were announced/)
		).toBeVisible();
		expect(
			screen.getByRole("button", { name: "Update ranking" })
		).toBeEnabled();
		expect(mocks.push).not.toHaveBeenCalled();
	});

	it("explains when ranking isn't open", () => {
		const { unmount } = mount(finalists, true);
		expect(
			screen.getByRole("heading", { name: "Ranking is closed" })
		).toBeVisible();
		unmount();

		mount([]);
		expect(
			screen.getByRole("heading", { name: "No finalists to rank" })
		).toBeVisible();
	});
});
