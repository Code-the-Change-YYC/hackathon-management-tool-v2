import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DashboardView } from "@/app/components/judge/dashboard/DashboardView";
import { JudgeNextTeam } from "@/app/components/judge/dashboard/JudgeNextTeam";
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
import { JudgeScheduleEvent } from "@/app/components/judge/schedule/JudgeScheduleEvent";
import { groupScheduleByDate } from "@/app/components/judge/schedule/judgeSchedule";
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

describe("judge schedule", () => {
	it("groups scheduled teams by Calgary date without mutating query data", () => {
		const first = assignment({
			id: "first",
			startsAt: new Date("2026-09-19T23:59:00-06:00")
		});
		const next = assignment({
			id: "next",
			startsAt: new Date("2026-09-20T00:01:00-06:00")
		});
		const input = [next, first];
		expect(groupScheduleByDate(input)).toEqual([[first], [next]]);
		expect(input[0]).toBe(next);
		expect(groupScheduleByDate([])).toEqual([]);
	});

	it("opens scoring at the scheduled time without implying a live presentation status", () => {
		const team = assignment();
		const { rerender } = render(
			<JudgeScheduleEvent
				assignment={team}
				criteria={[main]}
				currentTime={new Date(now.getTime() - 60000)}
			/>
		);
		expect(screen.getByText("In 1 min")).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: "Score team for Team" })
		).toBeDisabled();
		rerender(
			<JudgeScheduleEvent
				assignment={team}
				criteria={[main]}
				currentTime={now}
			/>
		);
		expect(screen.getByText("Scheduled time reached")).toBeInTheDocument();
		expect(
			screen.getByRole("link", { name: "Score team for Team" })
		).toHaveAttribute("href", "/judge/score/assignment");
	});

	it("shows scored status and a saved main total", () => {
		render(
			<JudgeScheduleEvent
				assignment={assignment({ scores: [score("main", 1)] })}
				criteria={[main]}
				currentTime={now}
			/>
		);
		expect(screen.getByText("Scores recorded")).toBeInTheDocument();
		expect(screen.getByText("Main score: 1/5")).toBeInTheDocument();
	});
});

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
			otherJudges: ["Sam"]
		});
		expect(getJudgeTable([], "judge")).toBeNull();
	});
});

describe("judge dashboard", () => {
	it("shows an empty state before any teams are assigned", () => {
		render(
			<DashboardView
				activeRoundId={null}
				assignments={[]}
				criteria={[main]}
				rounds={[]}
				userId="judge"
				userName="Dara"
			/>
		);
		expect(screen.getByText("No table assigned yet.")).toBeVisible();
		expect(screen.getByText("No teams assigned yet")).toBeVisible();
		expect(screen.queryByRole("link")).not.toBeInTheDocument();
	});

	it("puts the next unscored team first and tracks progress", () => {
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
				rounds={[judgingRound()]}
				userId="judge"
				userName="Dara"
			/>
		);
		expect(
			screen.getByText("You’re at Table 1 for the Round 1 with Sam.")
		).toBeVisible();
		expect(screen.getByRole("heading", { name: "Next" })).toBeVisible();
		expect(screen.getByText("1 of 2 scored")).toBeVisible();
		expect(
			screen.getByRole("link", { name: "Edit score for Done" })
		).toHaveAttribute("href", "/judge/score/done");
	});

	it("celebrates a finished round and switches rounds", () => {
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
		render(
			<DashboardView
				activeRoundId="round"
				assignments={[assignment({ scores: [score("main", 4)] }), finalsTeam]}
				criteria={[main]}
				rounds={[judgingRound(), finals]}
				userId="judge"
				userName="Dara"
			/>
		);
		expect(screen.getByText("All 1 teams scored")).toBeVisible();
		fireEvent.click(screen.getByRole("button", { name: /Finals/ }));
		expect(screen.getByRole("heading", { name: "Finalist" })).toBeVisible();
		expect(
			screen.getByText("You’re at the final table for the Finals with Sam.")
		).toBeVisible();
	});
});

describe("dashboard team rows", () => {
	it.each([
		"team",
		"schedule"
	])("shows the correct completed total in the %s view with multiple rounds", (kind) => {
		const criteria = [
			{ ...main, roundIds: ["round"] },
			{ ...main, id: "final", name: "Final criterion", roundIds: ["final"] }
		];
		const team = assignment({ scores: [score("main", 4), score("final", 5)] });
		render(
			kind === "team" ? (
				<JudgeTeamRow assignment={team} criteria={criteria} currentTime={now} />
			) : (
				<JudgeScheduleEvent
					assignment={team}
					criteria={criteria}
					currentTime={now}
				/>
			)
		);
		if (kind === "team") {
			expect(screen.getByText(/Scored/)).toBeInTheDocument();
			expect(screen.getByRole("link")).toHaveTextContent("4/5");
			expect(screen.getByRole("link")).not.toHaveTextContent("Final criterion");
		} else {
			expect(screen.getByText("Scores recorded")).toBeInTheDocument();
			expect(screen.getByText("Main score: 4/5")).toBeInTheDocument();
		}
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
		expect(screen.getByText(/Presenting now/)).toBeInTheDocument();
		rerender(
			<JudgeTeamRow
				assignment={assignment()}
				criteria={[main]}
				currentTime={new Date(now.getTime() + 8 * 60_000)}
			/>
		);
		expect(screen.queryByText(/Presenting now/)).not.toBeInTheDocument();
	});

	it("allows editing a submitted scorecard before the slot and displays sidepots separately", () => {
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
		expect(link).toHaveTextContent("Innovation 1 · Best AI 4/5");
		expect(link).toHaveTextContent("1/5");
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
		expect(screen.queryByText(/Scored/)).not.toBeInTheDocument();
		expect(
			screen.getByRole("link", { name: "Score Team" })
		).toBeInTheDocument();
	});
});

describe("judge next team", () => {
	it("waits for the slot before offering to score", () => {
		render(
			<JudgeNextTeam
				assignment={assignment()}
				currentTime={new Date(now.getTime() - 5 * 60_000)}
				teamCount={1}
			/>
		);
		expect(screen.getByRole("button", { name: /Opens at/ })).toBeDisabled();
		expect(screen.getByText(/In 5 min/)).toBeInTheDocument();
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
		expect(screen.getByText("Team ID ------")).toBeInTheDocument();
	});
});
