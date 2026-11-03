import {
	fireEvent,
	render,
	screen,
	waitFor,
	within
} from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ScoreRelease } from "@/app/components/admin/judging/ScoreRelease";

const mocks = vi.hoisted(() => ({ setReleased: vi.fn() }));
vi.mock("@/hooks/use-refresh", () => ({
	useRefresh: () => ({ isRefreshing: false, refresh: vi.fn() })
}));
vi.mock("@/trpc/react", () => ({
	api: {
		hackathonSettings: {
			setScoresReleased: {
				useMutation: () => ({ mutate: mocks.setReleased, isPending: false })
			}
		}
	}
}));

beforeEach(() => {
	vi.clearAllMocks();
});

describe("score release", () => {
	it("releases scores after confirmation", async () => {
		render(<ScoreRelease ballotsComplete released={false} />);
		expect(screen.getByText("Not released")).toBeVisible();

		fireEvent.click(screen.getByRole("button", { name: "Release scores" }));
		const dialog = await screen.findByRole("alertdialog", {
			name: "Release scores?"
		});
		expect(
			within(dialog).queryByText(/Not every judge/)
		).not.toBeInTheDocument();
		fireEvent.click(
			within(dialog).getByRole("button", { name: "Release scores" })
		);
		await waitFor(() =>
			expect(mocks.setReleased).toHaveBeenCalledWith({ released: true })
		);
	});
	it("warns when judges are still ranking the finalists", async () => {
		render(<ScoreRelease ballotsComplete={false} released={false} />);
		fireEvent.click(screen.getByRole("button", { name: "Release scores" }));
		const dialog = await screen.findByRole("alertdialog");
		expect(
			within(dialog).getByText(/Not every judge has ranked the finalists yet/)
		).toBeVisible();
		fireEvent.click(within(dialog).getByRole("button", { name: "Cancel" }));
		expect(mocks.setReleased).not.toHaveBeenCalled();
	});
	it("hides released scores after confirmation", async () => {
		render(<ScoreRelease ballotsComplete released />);
		expect(screen.getByText("Released")).toBeVisible();

		fireEvent.click(screen.getByRole("button", { name: "Hide scores" }));
		const dialog = await screen.findByRole("alertdialog", {
			name: "Hide scores?"
		});
		fireEvent.click(
			within(dialog).getByRole("button", { name: "Hide scores" })
		);
		await waitFor(() =>
			expect(mocks.setReleased).toHaveBeenCalledWith({ released: false })
		);
	});
});
