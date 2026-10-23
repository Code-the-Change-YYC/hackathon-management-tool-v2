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
		expect(screen.getByRole("button", { name: /Impact/ })).toHaveAttribute(
			"aria-expanded",
			"true"
		);
		expect(screen.getByRole("button", { name: /Innovation/ })).toHaveAttribute(
			"aria-expanded",
			"false"
		);
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
		expect(screen.getByRole("button", { name: /Innovation/ })).toHaveAttribute(
			"aria-expanded",
			"true"
		);
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
			screen.getByText("No judging criteria configured")
		).toBeInTheDocument();
		expect(screen.queryByRole("button")).not.toBeInTheDocument();
	});

	it("separates main and side-pot criteria and excludes side pots from the main maximum", () => {
		render(<JudgeRubric criteria={[sidepot, innovation, impact]} />);
		expect(
			screen.getByRole("heading", { name: "Main judging criteria" })
		).toBeInTheDocument();
		expect(
			screen.getByRole("heading", { name: "Side pots" })
		).toBeInTheDocument();
		expect(
			screen.getByText("2 main criteria · 20 maximum points · 1 side pot")
		).toBeInTheDocument();
	});

	it("expands all criteria for comparison and preserves collapsed choices across updates", () => {
		const { rerender } = render(
			<JudgeRubric criteria={[innovation, impact, sidepot]} />
		);
		fireEvent.click(screen.getByRole("button", { name: "Expand all" }));
		for (const name of [/Innovation/, /Impact/, /Best AI/])
			expect(screen.getByRole("button", { name })).toHaveAttribute(
				"aria-expanded",
				"true"
			);
		fireEvent.click(screen.getByRole("button", { name: "Collapse all" }));
		rerender(
			<JudgeRubric
				criteria={[
					{ ...innovation, description: "Updated description" },
					impact,
					sidepot
				]}
			/>
		);
		for (const name of [/Innovation/, /Impact/, /Best AI/])
			expect(screen.getByRole("button", { name })).toHaveAttribute(
				"aria-expanded",
				"false"
			);
	});

	it("shows missing-description guidance and handles side-pot-only rubrics", () => {
		render(<JudgeRubric criteria={[{ ...sidepot, description: " " }]} />);
		expect(
			screen.getByText(/No criterion-specific description has been provided/)
		).toBeInTheDocument();
		expect(
			screen.getByText(/Assess how well this project meets the Best AI sidepot/)
		).toBeInTheDocument();
		expect(
			screen.queryByRole("heading", { name: "Main judging criteria" })
		).not.toBeInTheDocument();
		expect(
			screen.getByText("No main judging criteria configured · 1 side pot")
		).toBeInTheDocument();
	});

	it("opens the first criterion when previously empty data becomes available", () => {
		const { rerender } = render(<JudgeRubric criteria={[]} />);
		rerender(<JudgeRubric criteria={[impact]} />);
		expect(screen.getByRole("button", { name: /Impact/ })).toHaveAttribute(
			"aria-expanded",
			"true"
		);
	});
});
