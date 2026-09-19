import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
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
