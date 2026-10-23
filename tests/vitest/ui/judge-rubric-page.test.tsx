import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { JudgeRubricPage } from "@/app/components/judges/JudgeRubricPage";
import type { Criterion } from "@/app/components/judges/judgePortal";

const mocks = vi.hoisted(() => ({ criteria: vi.fn() }));
// Only criteria are available: this page must not depend on rounds or settings.
vi.mock("@/trpc/react", async () => {
	const { useQuery } = await import("@tanstack/react-query");
	return {
		api: {
			criteria: {
				getAll: {
					useQuery: () =>
						useQuery({ queryKey: ["criteria"], queryFn: mocks.criteria })
				}
			}
		}
	};
});
const shared: Criterion = {
	id: "shared",
	name: "Shared criterion",
	description: "Shared assessment guidance.",
	maxScore: 10,
	displayOrder: 0,
	isSidepot: false,
	roundIds: []
};
const second: Criterion = {
	...shared,
	id: "second",
	name: "Second criterion",
	maxScore: 5,
	displayOrder: 1,
	roundIds: ["preliminary"]
};
const sidepot: Criterion = {
	...shared,
	id: "ai",
	name: "Best AI",
	maxScore: 5,
	isSidepot: true
};
let client: QueryClient;
function wrapper({ children }: { children: ReactNode }) {
	return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
beforeEach(() => {
	vi.resetAllMocks();
	client = new QueryClient({
		defaultOptions: { queries: { retry: false, staleTime: Infinity } }
	});
	mocks.criteria.mockResolvedValue([shared, second, sidepot]);
});
afterEach(() => {
	cleanup();
	client.clear();
});

describe("judge rubric page", () => {
	it("shows one shared rubric without round tabs or round-dependent filtering", async () => {
		render(<JudgeRubricPage />, { wrapper });
		await screen.findByRole("button", { name: /Shared criterion/ });
		expect(
			screen.getByRole("button", { name: /Second criterion/ })
		).toBeInTheDocument();
		expect(screen.getByRole("button", { name: /Best AI/ })).toBeInTheDocument();
		expect(
			screen.getByText("2 main criteria · 15 maximum points · 1 side pot")
		).toBeInTheDocument();
		expect(
			screen.getByText(
				"Review the criteria and score ranges used for all rounds."
			)
		).toBeInTheDocument();
		expect(screen.queryByRole("tablist")).not.toBeInTheDocument();
		expect(
			screen.queryByText(/Rounds have not been configured/)
		).not.toBeInTheDocument();
	});

	it("preserves expanded criteria when shared guidance is refreshed", async () => {
		render(<JudgeRubricPage />, { wrapper });
		await screen.findByRole("button", { name: /Second criterion/ });
		fireEvent.click(screen.getByRole("button", { name: /Second criterion/ }));
		mocks.criteria.mockResolvedValue([
			shared,
			{ ...second, description: "Updated assessment guidance." },
			sidepot
		]);
		fireEvent.click(screen.getByRole("button", { name: "Refresh rubric" }));
		await screen.findByText("Updated assessment guidance.");
		expect(
			screen.getByRole("button", { name: /Second criterion/ })
		).toHaveAttribute("aria-expanded", "true");
	});

	it("distinguishes an empty rubric from a failed request", async () => {
		mocks.criteria.mockResolvedValue([]);
		render(<JudgeRubricPage />, { wrapper });
		await screen.findByText("No judging criteria configured");
		expect(screen.queryByRole("alert")).not.toBeInTheDocument();
	});

	it("preserves cached guidance after refresh failure and can recover", async () => {
		render(<JudgeRubricPage />, { wrapper });
		await screen.findByText("Shared assessment guidance.");
		mocks.criteria.mockRejectedValue(new Error("Offline"));
		fireEvent.click(screen.getByRole("button", { name: "Refresh rubric" }));
		await screen.findByRole("alert");
		expect(
			screen.getByText("Rubric could not be refreshed")
		).toBeInTheDocument();
		expect(screen.getByText("Shared assessment guidance.")).toBeInTheDocument();
		mocks.criteria.mockResolvedValue([
			{ ...shared, description: "Recovered guidance." }
		]);
		fireEvent.click(screen.getByRole("button", { name: "Refresh rubric" }));
		await screen.findByText("Recovered guidance.");
		expect(screen.queryByRole("alert")).not.toBeInTheDocument();
	});

	it("offers retry after an initial failure without presenting an empty rubric", async () => {
		mocks.criteria.mockRejectedValue(new Error("Offline"));
		render(<JudgeRubricPage />, { wrapper });
		await screen.findByRole("alert");
		expect(screen.getByText("Rubric could not be loaded")).toBeInTheDocument();
		expect(
			screen.queryByText("No judging criteria configured")
		).not.toBeInTheDocument();
		mocks.criteria.mockResolvedValue([shared]);
		fireEvent.click(screen.getByRole("button", { name: "Refresh rubric" }));
		await screen.findByText("Shared assessment guidance.");
		expect(screen.queryByRole("alert")).not.toBeInTheDocument();
	});

	it("shows loading feedback and prevents duplicate manual refreshes", () => {
		mocks.criteria.mockReturnValue(new Promise(() => {}));
		render(<JudgeRubricPage />, { wrapper });
		expect(screen.getByText("Loading rubric…")).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: "Refreshing rubric" })
		).toBeDisabled();
	});
});
