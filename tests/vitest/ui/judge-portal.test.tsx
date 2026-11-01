import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DashboardView } from "@/app/components/judge/dashboard/DashboardView";
import { JudgeTeamRow } from "@/app/components/judge/dashboard/JudgeTeamRow";
import {
	type Criterion,
	getAssignmentTotal,
	getDraftScore,
	getJudgeTable,
	getScoreOptions,
	isAssignmentScored,
	sortAssignments,
	withBreaks
} from "@/app/components/judge/judgePortal";
import {
	judgeAssignment as assignment,
	judgeTable,
	judgingRound,
	judgingNow as now,
	judgeScore as score
} from "../helpers/judging";

const main: Criterion = {
	id: "main",
	name: "Innovation",
	description: "",
	displayOrder: 0,
	maxScore: 5,
	isSidepot: false
};
const sidepot: Criterion = { ...main, id: "sidepot", isSidepot: true };

describe("judge portal scoring contract", () => {
	it("only uses the criteria that apply to the assignment's round", () => {
		const criteria = [
			{ ...main, roundIds: ["round"] },
			{ ...main, id: "final", name: "Final criterion", roundIds: ["final"] }
		];
		const team = assignment({ scores: [score("main", 4), score("final", 5)] });
		expect(isAssignmentScored(team, criteria)).toBe(true);
		expect(getAssignmentTotal(team, criteria)).toEqual({ total: 4, max: 5 });
		expect(
			isAssignmentScored(assignment({ scores: [score("final", 5)] }), criteria)
		).toBe(false);
	});

	it("requires every criterion for the round and separates sidepots from main totals", () => {
		const criteria = [
			{ ...main, roundIds: ["round"] },
			{ ...main, id: "shared", roundIds: [] },
			{ ...sidepot, roundIds: ["round"] },
			{ ...sidepot, id: "other-sidepot", roundIds: ["final"] }
		];
		const team = assignment({
			scores: [
				score("main", 4),
				score("shared", 1),
				score("sidepot", 4),
				score("other-sidepot", 5)
			]
		});
		expect(isAssignmentScored(team, criteria)).toBe(true);
		expect(getAssignmentTotal(team, criteria)).toEqual({ total: 5, max: 10 });
		expect(getAssignmentTotal(team, criteria, true)).toEqual({
			total: 9,
			max: 15
		});
		expect(
			isAssignmentScored(assignment({ scores: [score("main", 4)] }), criteria)
		).toBe(false);
	});

	it("does not let a sidepot score replace a required main score", () => {
		const criteria = [
			{ ...sidepot, roundIds: ["round"] },
			{ ...main, roundIds: ["final"] }
		];
		expect(
			isAssignmentScored(assignment({ scores: [score("main", 5)] }), criteria)
		).toBe(false);
		expect(
			isAssignmentScored(
				assignment({ scores: [score("sidepot", 0), score("main", 5)] }),
				criteria
			)
		).toBe(true);
	});
	it("requires every answer and accepts an explicit sidepot zero", () => {
		expect(
			isAssignmentScored(assignment({ scores: [score("main", 4)] }), [
				main,
				sidepot
			])
		).toBe(false);
		expect(
			isAssignmentScored(
				assignment({ scores: [score("main", 4), score("sidepot", 0)] }),
				[main, sidepot]
			)
		).toBe(true);
		expect(
			isAssignmentScored(
				assignment({ scores: [score("main", 0), score("sidepot", 0)] }),
				[main, sidepot]
			)
		).toBe(false);
	});

	it("keeps the existing completion rule when no main criteria exist", () => {
		expect(isAssignmentScored(assignment(), [sidepot])).toBe(false);
		expect(
			isAssignmentScored(assignment({ scores: [score("sidepot", 0)] }), [
				sidepot
			])
		).toBe(true);
	});

	it("excludes sidepots and removed criteria from main totals", () => {
		const team = assignment({
			scores: [score("main", 4), score("sidepot", 4), score("removed", 5)]
		});
		expect(getAssignmentTotal(team, [main, sidepot])).toEqual({
			total: 4,
			max: 5
		});
		expect(getAssignmentTotal(team, [main, sidepot], true)).toEqual({
			total: 8,
			max: 10
		});
	});

	it("distinguishes zero drafts from missing scores and preserves zero when editing", () => {
		expect(getDraftScore({ main: 0 }, "main")).toBe(0);
		expect(getDraftScore({}, "main")).toBeUndefined();
		expect(getScoreOptions(main, false)[0]).toBe(1);
		expect(getScoreOptions(main, false, 0)[0]).toBe(0);
		expect(getScoreOptions(sidepot, true)).toEqual([0, 1, 2, 3, 4, 5]);
	});

	it("orders teams by time then name", () => {
		const alpha = assignment({
			id: "alpha",
			team: { ...assignment().team, name: "Alpha" }
		});
		const beta = assignment({
			id: "beta",
			team: { ...assignment().team, name: "Beta" }
		});
		const later = assignment({
			id: "later",
			startsAt: new Date(now.getTime() + 60_000)
		});
		expect(
			[later, beta, alpha].sort(sortAssignments).map(({ id }) => id)
		).toEqual(["alpha", "beta", "later"]);
	});

	it("shows a gap longer than one slot as a break", () => {
		const first = assignment({ id: "first" });
		const afterBreak = assignment({
			id: "after-break",
			startsAt: new Date(now.getTime() + 30 * 60_000)
		});
		const next = assignment({
			id: "next",
			startsAt: new Date(now.getTime() + 40 * 60_000)
		});
		expect(withBreaks([next, afterBreak, first])).toEqual([
			{ kind: "assignment", assignment: first },
			{
				kind: "break",
				startsAt: new Date(now.getTime() + 8 * 60_000),
				endsAt: afterBreak.startsAt
			},
			{ kind: "assignment", assignment: afterBreak },
			{ kind: "assignment", assignment: next }
		]);
	});
});

describe("judge table summary", () => {
	it("uses the earliest assignment's table and lists the other judges", () => {
		const later = assignment({
			id: "later",
			startsAt: new Date(now.getTime() + 60 * 60_000),
			table: judgeTable({ id: "later-table", tableNumber: 2 })
		});
		const earlier = assignment({ id: "earlier" });
		expect(getJudgeTable([later, earlier], "judge")).toEqual({
			name: "Table 1",
			number: 1,
			isFinal: false,
			otherJudges: [{ id: "judge-2", name: "Sam", image: null }]
		});
		expect(getJudgeTable([], "judge")).toBeNull();
	});
});

function expectTableCard(tableName: string, roundName: string) {
	const card = screen.getByRole("region", { name: tableName });
	expect(card).toHaveTextContent(`Your table for ${roundName}`);
	expect(card).toHaveTextContent("Judging with");
	expect(card).toHaveTextContent("Sam");
}

describe("judge dashboard", () => {
	it("shows an empty state before any teams are assigned", () => {
		render(
			<DashboardView
				activeRoundId={null}
				assignments={[]}
				criteria={[main]}
				userId="judge"
				userName="Dara"
			/>
		);
		expect(screen.queryByRole("region")).not.toBeInTheDocument();
		expect(screen.getByText("No teams assigned yet")).toBeVisible();
		expect(screen.queryByRole("link")).not.toBeInTheDocument();
	});

	it("says when the judge is alone at their table", () => {
		const [dara] = judgeTable().judges;
		render(
			<DashboardView
				activeRoundId="round"
				assignments={[
					assignment({ table: judgeTable({ judges: dara ? [dara] : [] }) })
				]}
				criteria={[main]}
				userId="judge"
				userName="Dara"
			/>
		);
		expect(screen.getByRole("region", { name: "Table 1" })).toHaveTextContent(
			"You’re the only judge at this table."
		);
	});

	it("collapses a crowded table to three judges and a count", () => {
		const [dara] = judgeTable().judges;
		const seats = (count: number) =>
			Array.from({ length: count }, (_, index) => ({
				id: `seat-${index}`,
				tableId: "table",
				judgeId: `judge-${index}`,
				createdAt: now,
				judge: { id: `judge-${index}`, name: `Judge ${index}`, image: null }
			}));
		const renderTable = (otherJudges: number) =>
			render(
				<DashboardView
					activeRoundId="round"
					assignments={[
						assignment({
							table: judgeTable({
								judges: [...(dara ? [dara] : []), ...seats(otherJudges)]
							})
						})
					]}
					criteria={[main]}
					userId="judge"
					userName="Dara"
				/>
			);

		const { unmount } = renderTable(24);
		const crowded = screen.getByRole("region", { name: "Table 1" });
		expect(within(crowded).getAllByRole("listitem")).toHaveLength(4);
		expect(crowded).toHaveTextContent("Judge 2");
		expect(crowded).not.toHaveTextContent("Judge 3");
		expect(crowded).toHaveTextContent("+21 others");
		unmount();

		renderTable(4);
		const four = screen.getByRole("region", { name: "Table 1" });
		expect(within(four).getAllByRole("listitem")).toHaveLength(4);
		expect(four).toHaveTextContent("Judge 3");
		expect(four).not.toHaveTextContent("others");
	});

	it("lists the round's teams in time order and tracks progress", () => {
		const done = assignment({
			id: "done",
			scores: [score("main", 4)],
			team: { ...assignment().team, name: "Done" }
		});
		const next = assignment({
			id: "next",
			startsAt: new Date(now.getTime() + 60_000),
			team: { ...assignment().team, name: "Next" }
		});
		render(
			<DashboardView
				activeRoundId="round"
				assignments={[next, done]}
				criteria={[main]}
				userId="judge"
				userName="Dara"
			/>
		);
		expectTableCard("Table 1", "Round 1");
		const rows = within(
			screen.getByRole("region", { name: "Round 1" })
		).getAllByRole("listitem");
		expect(rows.map((row) => row.textContent)).toEqual([
			expect.stringContaining("Done"),
			expect.stringContaining("Next")
		]);
		expect(screen.getByText("1 of 2 scored")).toBeVisible();
		expect(
			screen.getByRole("link", { name: "Edit score for Done" })
		).toHaveAttribute("href", "/judge/score/done");
	});

	it("stacks every round and moves on once a round is scored", () => {
		const finals = judgingRound({
			id: "finals",
			name: "Finals",
			kind: "final",
			startTime: new Date(now.getTime() + 60 * 60_000)
		});
		const finalsTeam = assignment({
			id: "finals-team",
			table: judgeTable({ id: "finals-table", round: finals }),
			team: { ...assignment().team, name: "Finalist" }
		});
		const props = {
			activeRoundId: "round",
			criteria: [main],
			userId: "judge",
			userName: "Dara"
		};
		const { rerender } = render(
			<DashboardView
				{...props}
				assignments={[assignment({ scores: [score("main", 4)] }), finalsTeam]}
			/>
		);
		expect(screen.getByRole("region", { name: "Round 1" })).toHaveTextContent(
			"1 of 1 scored"
		);
		expect(screen.getByRole("region", { name: "Finals" })).toHaveTextContent(
			"0 of 1 scored"
		);
		expect(
			within(screen.getByRole("region", { name: "Finals" })).getByText(
				"Finalist"
			)
		).toBeVisible();
		expectTableCard("Final table", "Finals");

		rerender(
			<DashboardView
				{...props}
				assignments={[
					assignment({ scores: [score("main", 4)] }),
					{ ...finalsTeam, scores: [score("main", 3)] }
				]}
			/>
		);
		expect(screen.getByRole("region", { name: "Finals" })).toHaveTextContent(
			"1 of 1 scored"
		);
		expectTableCard("Table 1", "Round 1");
	});

	it("describes the active round's table ahead of earlier leftovers", () => {
		const finals = judgingRound({
			id: "finals",
			name: "Finals",
			kind: "final"
		});
		render(
			<DashboardView
				activeRoundId="finals"
				assignments={[
					assignment({ team: { ...assignment().team, name: "Leftover" } }),
					assignment({
						id: "finals-team",
						table: judgeTable({ id: "finals-table", round: finals }),
						team: { ...assignment().team, name: "Finalist" }
					})
				]}
				criteria={[main]}
				userId="judge"
				userName="Dara"
			/>
		);
		expectTableCard("Final table", "Finals");
	});
});

describe("dashboard team rows", () => {
	it("shows the correct completed total with multiple rounds", () => {
		const criteria = [
			{ ...main, roundIds: ["round"] },
			{ ...main, id: "final", name: "Final criterion", roundIds: ["final"] }
		];
		const team = assignment({ scores: [score("main", 4), score("final", 5)] });
		render(
			<JudgeTeamRow assignment={team} criteria={criteria} currentTime={now} />
		);
		expect(screen.getByRole("link")).toHaveTextContent("4/5");
		expect(screen.getByRole("link")).not.toHaveTextContent("Final criterion");
	});

	it("locks future teams and opens scoring when the slot starts", () => {
		const team = assignment();
		const { rerender } = render(
			<JudgeTeamRow
				assignment={team}
				criteria={[main]}
				currentTime={new Date(now.getTime() - 60_000)}
			/>
		);
		expect(screen.getByText("In 1 min")).toBeInTheDocument();
		expect(screen.queryByRole("link")).not.toBeInTheDocument();
		rerender(
			<JudgeTeamRow assignment={team} criteria={[main]} currentTime={now} />
		);
		expect(screen.getByRole("link", { name: "Score Team" })).toHaveAttribute(
			"href",
			"/judge/score/assignment"
		);
	});

	it("marks the team presenting right now", () => {
		const { rerender } = render(
			<JudgeTeamRow
				assignment={assignment()}
				criteria={[main]}
				currentTime={new Date(now.getTime() + 60_000)}
			/>
		);
		expect(screen.getByRole("listitem")).toHaveClass("bg-purple-50");
		rerender(
			<JudgeTeamRow
				assignment={assignment()}
				criteria={[main]}
				currentTime={new Date(now.getTime() + 8 * 60_000)}
			/>
		);
		expect(screen.getByRole("listitem")).not.toHaveClass("bg-purple-50");
	});

	it("puts a scored team on a primary background, even while presenting", () => {
		render(
			<JudgeTeamRow
				assignment={assignment({ scores: [score("main", 4)] })}
				criteria={[main]}
				currentTime={new Date(now.getTime() + 60_000)}
			/>
		);
		expect(screen.getByText("4:00 AM")).toBeInTheDocument();
		expect(screen.getByRole("listitem")).toHaveClass("bg-primary");
		expect(screen.getByRole("listitem")).not.toHaveClass("bg-purple-50");
	});

	it("allows editing a submitted scorecard before the slot and leaves sidepots out of the total", () => {
		render(
			<JudgeTeamRow
				assignment={assignment({
					scores: [score("main", 1), score("sidepot", 4)]
				})}
				criteria={[main, { ...sidepot, name: "Best AI" }]}
				currentTime={new Date(now.getTime() - 1)}
			/>
		);
		const link = screen.getByRole("link", { name: "Edit score for Team" });
		expect(link).toHaveAttribute("href", "/judge/score/assignment");
		expect(link).toHaveTextContent("1/5");
		expect(link).not.toHaveTextContent("Best AI");
		expect(screen.queryByRole("button")).not.toBeInTheDocument();
	});

	it("does not mark incomplete main scores as scored", () => {
		render(
			<JudgeTeamRow
				assignment={assignment({ scores: [score("main", 4)] })}
				criteria={[main, { ...main, id: "technical", name: "Technical" }]}
				currentTime={now}
			/>
		);
		expect(screen.getByText("Partially scored")).toBeInTheDocument();
		expect(screen.getByRole("link")).not.toHaveTextContent("4/");
		expect(
			screen.getByRole("link", { name: "Continue scoring Team" })
		).toHaveAttribute("href", "/judge/score/assignment");
	});

	it("lets judges continue a partial scorecard before the slot", () => {
		render(
			<JudgeTeamRow
				assignment={assignment({ scores: [score("main", 4)] })}
				criteria={[main, { ...main, id: "technical", name: "Technical" }]}
				currentTime={new Date(now.getTime() - 60_000)}
			/>
		);
		expect(
			screen.getByRole("link", { name: "Continue scoring Team" })
		).toBeInTheDocument();
	});
});

describe("team code", () => {
	it("never invents an ID when a team has no code", () => {
		const team = assignment({
			team: { ...assignment().team, teamCode: null }
		});
		render(
			<JudgeTeamRow assignment={team} criteria={[main]} currentTime={now} />
		);
		expect(screen.getByText("------")).toBeInTheDocument();
	});
});
