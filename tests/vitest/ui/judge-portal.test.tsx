import { render, renderHook, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { JudgeRoundStats } from "@/app/components/judges/JudgeRoundStats";
import { JudgeTeamCard } from "@/app/components/judges/JudgeTeamCard";
import {
	JudgeUserProvider,
	useJudgeUser
} from "@/app/components/judges/JudgeUserProvider";
import {
	type Criterion,
	getAssignmentTotal,
	getDraftScore,
	getScoreOptions,
	isAssignmentScored,
	type JudgeAssignment,
	sortAssignments
} from "@/app/components/judges/judgePortal";

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
