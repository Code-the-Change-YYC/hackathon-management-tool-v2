import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DashboardView } from "@/app/components/judge/dashboard/DashboardView";
import { JudgeRoundStats } from "@/app/components/judge/dashboard/JudgeRoundStats";
import { JudgeTeamCard } from "@/app/components/judge/dashboard/JudgeTeamCard";
import {
	type Criterion,
	getAssignmentTotal,
	getDraftScore,
	getMeetingLink,
	getRoomName,
	getScoreOptions,
	isAssignmentScored,
	type JudgeAssignment,
	sortAssignments
} from "@/app/components/judge/judgePortal";
import { JudgeScheduleEvent } from "@/app/components/judge/schedule/JudgeScheduleEvent";
import { groupScheduleByDate } from "@/app/components/judge/schedule/judgeSchedule";

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
		judgeId: "judge",
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

describe("judge room summary", () => {
	it("uses the earliest assignment's room and the first meeting link", () => {
		const later = assignment({
			id: "later",
			timeSlot: new Date(now.getTime() + 60 * 60_000),
			room: {
				...assignment().room,
				id: "later-room",
				name: "Room 2",
				roomLink: "https://example.com/room-2"
			}
		});
		const earlier = assignment({ id: "earlier" });
		expect(getRoomName([later, earlier])).toBe("Room 1");
		expect(getMeetingLink([later, earlier])).toBe("https://example.com/room-2");
		expect(getRoomName([])).toBeNull();
		expect(getMeetingLink([])).toBe("");
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
				userName="Dara"
			/>
		);
		expect(screen.getByText("No room assigned yet")).toBeVisible();
		expect(screen.getByText("No teams assigned yet")).toBeVisible();
	});

	it("lists the active round's teams with their room", () => {
		render(
			<DashboardView
				activeRoundId="round"
				assignments={[assignment()]}
				criteria={[main]}
				rounds={[assignment().room.round]}
				userName="Dara"
			/>
		);
		expect(
			screen.getByRole("heading", { name: "Teams · Round 1" })
		).toBeVisible();
		expect(screen.getByText("You’ve been assigned to Room 1")).toBeVisible();
		expect(screen.getByRole("heading", { name: "Team" })).toBeVisible();
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
