import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RubricView } from "@/app/components/judge/rubric/RubricView";

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

	it("shows the empty state in an untitled rubric card", () => {
		render(<RubricView criteria={[]} />);
		expect(screen.getByText("No judging criteria configured")).toBeVisible();
		expect(
			screen.getAllByRole("heading").map(({ textContent }) => textContent)
		).toEqual(["Judging Rubric"]);
	});
});
