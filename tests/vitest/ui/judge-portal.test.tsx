import { render, renderHook, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { JudgeRoundStats } from "@/app/components/judges/JudgeRoundStats";
import { JudgeScheduleEvent } from "@/app/components/judges/JudgeScheduleEvent";
import { JudgeTeamCard } from "@/app/components/judges/JudgeTeamCard";
import {
	JudgeUserProvider,
	useJudgeUser
} from "@/app/components/judges/JudgeUserProvider";
import {
	type Criterion,
	canScoreAssignment,
	getAssignmentScoreStatus,
	getAssignmentTotal,
	getDraftScore,
	getScoreOptions,
	isAssignmentScored,
	type JudgeAssignment,
	sortAssignments
} from "@/app/components/judges/judgePortal";
import {
	getScheduleRounds,
	getScheduleSummary,
	groupScheduleByDate
} from "@/app/components/judges/judgeSchedule";

const now = new Date("2026-09-19T10:00:00Z");
const main: Criterion = {
	id: "main",
	name: "Innovation",
	description: "",
	displayOrder: 0,
	maxScore: 10,
	isSidepot: false
};
const sidepot: Criterion = { ...main, id: "sidepot", isSidepot: true };

describe("judge schedule", () => {
	it("groups scheduled teams by Calgary date without mutating query data", () => {
		const first = assignment({
			id: "first",
			timeSlot: new Date("2026-09-19T23:59:00-06:00")
		});
		const next = assignment({
			id: "next",
			timeSlot: new Date("2026-09-20T00:01:00-06:00")
		});
		const input = [next, assignment({ timeSlot: null }), first];
		expect(groupScheduleByDate(input)).toEqual([[first], [next]]);
		expect(input[0]).toBe(next);
		expect(groupScheduleByDate([])).toEqual([]);
	});

	it("orders unique round tabs chronologically and includes newly assigned rounds", () => {
		const first = assignment();
		const finals = {
			...first.room.round,
			id: "finals",
			name: "Finals",
			startTime: new Date(now.getTime() + 60_000)
		};
		const second = assignment({
			id: "second",
			room: { ...first.room, roundId: "finals", round: finals }
		});
		const input = [second, first, first];
		const renamed = { ...first.room.round, name: "Updated preliminary" };
		expect(getScheduleRounds([renamed], input)).toEqual([renamed, finals]);
		expect(input[0]).toBe(second);
	});

	it("opens scoring at the scheduled time without claiming the presentation started", () => {
		const team = assignment();
		const { rerender } = render(
			<JudgeScheduleEvent
				assignment={team}
				criteria={[main]}
				currentTime={new Date(now.getTime() - 60_000)}
			/>
		);
		expect(screen.getByText(/In 1 min/)).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: "Score team for Team" })
		).toBeDisabled();
		expect(screen.queryByRole("link")).not.toBeInTheDocument();
		rerender(
			<JudgeScheduleEvent
				assignment={team}
				criteria={[main]}
				currentTime={now}
			/>
		);
		expect(screen.getByText("Scheduled time reached")).toBeInTheDocument();
		expect(screen.getByText("Not scored")).toBeInTheDocument();
		expect(
			screen.getByRole("link", { name: "Score team for Team" })
		).toHaveAttribute("href", "/judge/score/assignment");
		expect(screen.queryByText(/Estimated|Started/)).not.toBeInTheDocument();
	});

	it("shows scored status and a saved zero total", () => {
		render(
			<JudgeScheduleEvent
				assignment={assignment({ scores: [score("main", 0)] })}
				criteria={[main]}
				currentTime={now}
			/>
		);
		expect(screen.getByText("Scores recorded")).toBeInTheDocument();
		expect(screen.getByText("Main score: 0/10")).toBeInTheDocument();
		expect(screen.getByText("Scheduled time reached")).toBeInTheDocument();
		expect(
			screen.getByRole("link", { name: "Edit scores for Team" })
		).toBeInTheDocument();
	});

	it("distinguishes partial applicable scores from stale criteria", () => {
		const criteria = [main, { ...main, id: "second" }];
		expect(
			getAssignmentScoreStatus(
				assignment({ scores: [score("main", 0)] }),
				criteria
			)
		).toBe("Partially scored");
		expect(
			getAssignmentScoreStatus(
				assignment({ scores: [score("removed", 5)] }),
				criteria
			)
		).toBe("Not scored");
	});

	it("uses the same availability rule for future, due, unscheduled and scored teams", () => {
		const future = assignment({ timeSlot: new Date(now.getTime() + 60_000) });
		expect(canScoreAssignment(future, [main], now)).toBe(false);
		expect(canScoreAssignment(assignment(), [main], now)).toBe(true);
		expect(
			canScoreAssignment(assignment({ timeSlot: null }), [main], now)
		).toBe(true);
		expect(
			canScoreAssignment({ ...future, scores: [score("main", 0)] }, [main], now)
		).toBe(true);
	});

	it("summarizes only the explicitly active round and keeps backlog separate from the next team", () => {
		const due = assignment();
		const future = assignment({
			id: "future",
			timeSlot: new Date(now.getTime() + 60_000)
		});
		const other = assignment({
			id: "other",
			room: { ...due.room, roundId: "finals" }
		});
		const completed = assignment({ id: "done", scores: [score("main", 0)] });
		const unscheduled = assignment({ id: "unscheduled", timeSlot: null });
		const input = [other, future, unscheduled, completed, due];
		expect(getScheduleSummary(input, [main], "round", now)).toEqual({
			outstandingCount: 3,
			needsScoring: due,
			nextScheduled: future
		});
		expect(getScheduleSummary(input, [main], "", now)).toEqual({
			outstandingCount: 0,
			needsScoring: undefined,
			nextScheduled: undefined
		});
		expect(input[0]).toBe(other);
	});

	it("shows unscheduled teams as actionable and rejects unsafe meeting URLs", () => {
		const team = assignment({ timeSlot: null });
		render(
			<JudgeScheduleEvent
				assignment={{
					...team,
					room: { ...team.room, roomLink: "javascript:alert(1)" }
				}}
				criteria={[main]}
				currentTime={now}
			/>
		);
		expect(screen.getByText("Time not assigned")).toBeInTheDocument();
		expect(
			screen.getByRole("link", { name: "Score team for Team" })
		).toBeInTheDocument();
		expect(
			screen.queryByRole("link", { name: /Join meeting/ })
		).not.toBeInTheDocument();
	});
});

function assignment(overrides: Partial<JudgeAssignment> = {}): JudgeAssignment {
	return {
		id: "assignment",
		teamId: "team",
		roomId: "room",
		createdAt: now,
		timeSlot: now,
		scores: [],
		team: {
			id: "team",
			name: "Team",
			slug: "team",
			logo: null,
			metadata: null,
			createdAt: now,
			teamCode: "ABCD",
			prescreenStatus: "pending",
			prescreenComments: null,
			prescreenedBy: null,
			prescreenedAt: null
		},
		room: {
			id: "room",
			name: "Room 1",
			roundId: "round",
			roomLink: "",
			createdAt: now,
			updatedAt: now,
			round: {
				id: "round",
				name: "Round 1",
				startTime: now,
				endTime: now,
				createdAt: now,
				updatedAt: now
			}
		},
		...overrides
	};
}

function score(criteriaId: string, value: number) {
	return {
		id: criteriaId,
		assignmentId: "assignment",
		criteriaId,
		value,
		createdAt: now
	};
}

describe("judge portal scoring contract", () => {
	it("scopes completion and totals to the assignment round", () => {
		const criteria = [
			{ ...main, roundIds: ["round"] },
			{ ...main, id: "final", name: "Final criterion", roundIds: ["final"] }
		];
		const team = assignment({ scores: [score("main", 7), score("final", 10)] });
		expect(isAssignmentScored(team, criteria)).toBe(true);
		expect(getAssignmentTotal(team, criteria)).toEqual({ total: 7, max: 10 });
		expect(
			isAssignmentScored(assignment({ scores: [score("final", 10)] }), criteria)
		).toBe(false);
	});

	it("keeps shared criteria and applicable sidepots while ignoring other rounds", () => {
		const criteria = [
			{ ...main, roundIds: ["round"] },
			{ ...main, id: "shared", roundIds: [] },
			{ ...sidepot, roundIds: ["round"] },
			{ ...sidepot, id: "other-sidepot", roundIds: ["final"] }
		];
		const team = assignment({
			scores: [
				score("main", 7),
				score("shared", 0),
				score("sidepot", 4),
				score("other-sidepot", 10)
			]
		});
		expect(isAssignmentScored(team, criteria)).toBe(true);
		expect(getAssignmentTotal(team, criteria)).toEqual({ total: 7, max: 20 });
		expect(getAssignmentTotal(team, criteria, true)).toEqual({
			total: 11,
			max: 30
		});
		expect(
			isAssignmentScored(assignment({ scores: [score("main", 7)] }), criteria)
		).toBe(false);
	});

	it("does not let scores from unavailable criteria complete a sidepot-only round", () => {
		const criteria = [
			{ ...sidepot, roundIds: ["round"] },
			{ ...main, roundIds: ["final"] }
		];
		expect(
			isAssignmentScored(assignment({ scores: [score("main", 10)] }), criteria)
		).toBe(false);
		expect(
			isAssignmentScored(
				assignment({ scores: [score("sidepot", 0)] }),
				criteria
			)
		).toBe(true);
	});
	it("counts saved zero as scored and does not require optional sidepots", () => {
		expect(
			isAssignmentScored(assignment({ scores: [score("main", 0)] }), [
				main,
				sidepot
			])
		).toBe(true);
		expect(
			isAssignmentScored(assignment({ scores: [score("sidepot", 10)] }), [
				main,
				sidepot
			])
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
			scores: [score("main", 7), score("sidepot", 4), score("removed", 9)]
		});
		expect(getAssignmentTotal(team, [main, sidepot])).toEqual({
			total: 7,
			max: 10
		});
		expect(getAssignmentTotal(team, [main, sidepot], true)).toEqual({
			total: 11,
			max: 20
		});
	});

	it("distinguishes zero drafts from missing scores and preserves zero when editing", () => {
		expect(getDraftScore({ main: 0 }, "main")).toBe(0);
		expect(getDraftScore({}, "main")).toBeUndefined();
		expect(getScoreOptions(main, false)[0]).toBe(1);
		expect(getScoreOptions(main, false, 0)[0]).toBe(0);
		expect(getScoreOptions(sidepot, true)).toEqual([
			0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10
		]);
	});

	it("orders scheduled teams by time then name, with unscheduled teams last", () => {
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
			timeSlot: new Date(now.getTime() + 60_000)
		});
		const unscheduled = assignment({ id: "unscheduled", timeSlot: null });
		expect(
			[unscheduled, later, beta, alpha]
				.sort(sortAssignments)
				.map(({ id }) => id)
		).toEqual(["alpha", "beta", "later", "unscheduled"]);
	});
});

describe("judge user context", () => {
	it("provides the signed-in judge without a query provider", () => {
		const { result } = renderHook(useJudgeUser, {
			wrapper: ({ children }) => (
				<JudgeUserProvider userId="judge" userName="Dara">
					{children}
				</JudgeUserProvider>
			)
		});
		expect(result.current).toEqual({ userId: "judge", userName: "Dara" });
	});

	it("fails clearly when the judge provider is missing", () => {
		expect(() => renderHook(useJudgeUser)).toThrow(
			"Judge portal user context is missing."
		);
	});
});

describe("dashboard cards", () => {
	it.each([
		"team",
		"schedule"
	])("shows the correct completed total in the %s card with multiple rounds", (kind) => {
		const criteria = [
			{ ...main, roundIds: ["round"] },
			{ ...main, id: "final", name: "Final criterion", roundIds: ["final"] }
		];
		const team = assignment({ scores: [score("main", 7)] });
		render(
			kind === "team" ? (
				<JudgeTeamCard
					assignment={team}
					criteria={criteria}
					currentTime={now}
				/>
			) : (
				<JudgeScheduleEvent
					assignment={team}
					criteria={criteria}
					currentTime={now}
				/>
			)
		);
		expect(
			screen.getByText(kind === "team" ? "Scored" : "Scores recorded")
		).toBeInTheDocument();
		expect(
			kind === "team"
				? screen.getByText("Total").parentElement
				: screen.getByText("Main score: 7/10")
		).toHaveTextContent("7/10");
		expect(screen.queryByText("Final criterion")).not.toBeInTheDocument();
	});
	it("disables future assignments and enables scoring when the slot starts", () => {
		const team = assignment();
		const { rerender } = render(
			<JudgeTeamCard
				assignment={team}
				criteria={[main]}
				currentTime={new Date(now.getTime() - 1)}
			/>
		);
		expect(screen.getByRole("button", { name: "Score Team" })).toBeDisabled();
		expect(screen.queryByRole("link")).not.toBeInTheDocument();
		rerender(
			<JudgeTeamCard assignment={team} criteria={[main]} currentTime={now} />
		);
		expect(screen.getByRole("link", { name: "Score Team" })).toHaveAttribute(
			"href",
			"/judge/score/assignment"
		);
	});

	it("keeps unscheduled teams scoreable with separated schedule labels", () => {
		render(
			<JudgeTeamCard
				assignment={assignment({ timeSlot: null })}
				criteria={[main]}
				currentTime={now}
			/>
		);
		expect(screen.getByText("Unscheduled · Round 1")).toBeInTheDocument();
		expect(
			screen.getByRole("link", { name: "Score Team" })
		).toBeInTheDocument();
	});

	it("allows editing a saved zero before the slot and displays optional scores separately", () => {
		render(
			<JudgeTeamCard
				assignment={assignment({
					scores: [score("main", 0), score("sidepot", 4)]
				})}
				criteria={[main, { ...sidepot, name: "Best AI" }]}
				currentTime={new Date(now.getTime() - 1)}
			/>
		);
		expect(
			screen.getByRole("link", { name: "Edit score for Team" })
		).toHaveAttribute("href", "/judge/score/assignment");
		expect(screen.getByText("Best AI 4/10")).toBeInTheDocument();
		const total = screen.getByText("Total").parentElement;
		expect(total).toHaveTextContent("0/10");
		expect(screen.queryByRole("button")).not.toBeInTheDocument();
	});

	it("does not mark incomplete main scores as scored", () => {
		render(
			<JudgeTeamCard
				assignment={assignment({ scores: [score("main", 8)] })}
				criteria={[main, { ...main, id: "technical", name: "Technical" }]}
				currentTime={now}
			/>
		);
		expect(screen.queryByText("Scored")).not.toBeInTheDocument();
		expect(
			screen.getByRole("link", { name: "Score Team" })
		).toBeInTheDocument();
	});

	it("derives remaining teams from assigned and scored counts", () => {
		render(<JudgeRoundStats assigned={4} name="Round 1" scored={1} />);
		expect(
			screen.getByRole("heading", { name: "Round 1" })
		).toBeInTheDocument();
		const remaining = screen.getByText("Remaining").parentElement;
		expect(remaining).toHaveTextContent("Remaining3");
	});
});
