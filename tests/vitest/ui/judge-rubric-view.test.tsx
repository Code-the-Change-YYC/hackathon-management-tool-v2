import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RubricView } from "@/app/components/judge/rubric/RubricView";

const refresh = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));

beforeEach(() => vi.clearAllMocks());

describe("shared judge rubric", () => {
	it("shows all criteria without a round selector", () => {
		render(
			<RubricView
				criteria={[
					{
						id: "main",
						name: "Technical execution",
						description: "Explain the working implementation.",
						displayOrder: 0,
						maxScore: 10,
						isSidepot: false,
						roundIds: ["historical-round"]
					}
				]}
			/>
		);
		expect(screen.getByText(/used for all rounds/)).toBeVisible();
		expect(
			screen.getByRole("button", { name: /Technical execution/ })
		).toBeVisible();
		expect(screen.queryByRole("tablist")).not.toBeInTheDocument();
	});

	it("can refresh an empty rubric after organizers configure criteria", () => {
		render(<RubricView criteria={[]} />);
		expect(screen.getByText("No judging criteria configured")).toBeVisible();
		fireEvent.click(screen.getByRole("button", { name: "Refresh rubric" }));
		expect(refresh).toHaveBeenCalledOnce();
	});
});
