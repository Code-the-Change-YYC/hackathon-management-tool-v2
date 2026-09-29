import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { JudgeRubric } from "@/app/components/judges/JudgeRubric";
import {
	type Criterion,
	getCriterionDescription,
	sortCriteria
} from "@/app/components/judges/judgePortal";

const innovation: Criterion = {
	id: "innovation",
	name: "Innovation",
	description: "Assess originality.\nReward a useful new approach.",
	displayOrder: 2,
	maxScore: 10,
	isSidepot: false
};
const impact: Criterion = {
	...innovation,
	id: "impact",
	name: "Impact",
	displayOrder: 1
};
const sidepot: Criterion = {
	...innovation,
	id: "ai",
	name: "Best AI",
	displayOrder: 0,
	isSidepot: true
};

describe("judge rubric", () => {
	it("orders main criteria by display order, then name, before sidepots", () => {
		const tied = { ...impact, id: "accessibility", name: "Accessibility" };
		expect(
			[sidepot, innovation, impact, tied].sort(sortCriteria).map(({ id }) => id)
		).toEqual(["accessibility", "impact", "innovation", "ai"]);
	});

	it("renders saved descriptions and opens the first ordered criterion without mutating input", () => {
		const criteria = [sidepot, innovation, impact];
		render(<JudgeRubric criteria={criteria} />);
		const buttons = screen.getAllByRole("button");
		expect(buttons[0]).toHaveTextContent("Impact");
		expect(buttons[0]).toHaveAttribute("aria-expanded", "true");
		expect(buttons[1]).toHaveAttribute("aria-expanded", "false");
		expect(screen.getByText(/Assess originality/)).toHaveTextContent(
			"Reward a useful new approach."
		);
		expect(criteria[0]).toBe(sidepot);
	});

	it("expands sidepots and includes zero in their rubric bands", async () => {
		render(<JudgeRubric criteria={[innovation, sidepot]} />);
		expect(screen.getByText("1–2 pts")).toBeInTheDocument();
		const trigger = screen.getByRole("button", { name: /Best AI/ });
		fireEvent.click(trigger);
		expect(trigger).toHaveAttribute("aria-expanded", "true");
		expect(await screen.findByText("0–2 pts")).toBeInTheDocument();
	});

	it("keeps the existing fallback when a description is empty", () => {
		expect(
			getCriterionDescription({ ...innovation, description: "  " })
		).toContain("Evaluate how strongly");
		expect(getCriterionDescription({ ...sidepot, description: "" })).toContain(
			"Best AI sidepot"
		);
	});

	it("shows an empty state without an accordion", () => {
		render(<JudgeRubric criteria={[]} />);
		expect(
			screen.getByText("No judging criteria have been published yet.")
		).toBeInTheDocument();
		expect(screen.queryByRole("button")).not.toBeInTheDocument();
	});
});
