import { addMinutes, differenceInMinutes } from "date-fns";
import { formatTime as formatClockTime } from "@/lib/datetime";
import { getScoringOpensAt } from "@/lib/judging";
import type { RouterOutputs } from "@/trpc/react";

export type JudgeAssignment =
	RouterOutputs["judgingAssignments"]["getByJudge"][number];
export type Criterion = RouterOutputs["criteria"]["getAll"][number];

export function sortCriteria(a: Criterion, b: Criterion) {
	return (
		Number(a.isSidepot) - Number(b.isSidepot) ||
		a.displayOrder - b.displayOrder ||
		a.name.localeCompare(b.name)
	);
}

export function formatTime(value?: Date | null) {
	return value ? formatClockTime(value) : "Unscheduled";
}

export function formatDuration(minutes: number) {
	if (minutes < 60) return `${minutes} min`;
	const hours = Math.floor(minutes / 60);
	const remainder = minutes % 60;
	return remainder ? `${hours} hr ${remainder} min` : `${hours} hr`;
}

export function getSlotStatus(startsAt: Date, currentTime: Date) {
	const minutes = differenceInMinutes(startsAt, currentTime, {
		roundingMethod: "ceil"
	});
	return minutes > 0 ? `In ${formatDuration(minutes)}` : "Started";
}

export function isScoringOpen(assignment: JudgeAssignment, currentTime: Date) {
	return getScoringOpensAt(assignment.startsAt) <= currentTime;
}

export function getPresentationEnd(assignment: JudgeAssignment) {
	return addMinutes(
		assignment.startsAt,
		assignment.table.round.presentationMinutes ?? 0
	);
}

export function isPresenting(assignment: JudgeAssignment, currentTime: Date) {
	return (
		assignment.startsAt <= currentTime &&
		currentTime < getPresentationEnd(assignment)
	);
}

export function getTeamCode(assignment: JudgeAssignment) {
	return assignment.team.teamCode ?? "------";
}

export function getTableName(assignment: JudgeAssignment) {
	return assignment.table.round.kind === "final"
		? "Final table"
		: `Table ${assignment.table.tableNumber}`;
}

export function sortAssignments(a: JudgeAssignment, b: JudgeAssignment) {
	return (
		a.startsAt.getTime() - b.startsAt.getTime() ||
		a.team.name.localeCompare(b.team.name)
	);
}

// Judges sit at one table per round, so the earliest assignment's table stands for all.
export function getJudgeTable(assignments: JudgeAssignment[], userId: string) {
	const first = assignments.slice().sort(sortAssignments)[0];
	if (!first) return null;
	return {
		name: getTableName(first),
		number: first.table.tableNumber,
		otherJudges: first.table.judges
			.filter(({ judge }) => judge.id !== userId)
			.map(({ judge }) => judge)
	};
}

export type ScheduleItem =
	| { kind: "assignment"; assignment: JudgeAssignment }
	| { kind: "break" | "free"; startsAt: Date; endsAt: Date };

// Fills the gaps between a judge's teams. A break is a gap when no table
// presents, from the end of the slot before it; a slot other tables use is
// free time at this table. roundSlotTimes holds every table's start times.
export function withBreaks(
	assignments: JudgeAssignment[],
	roundSlotTimes: Date[]
): ScheduleItem[] {
	const sorted = assignments.slice().sort(sortAssignments);
	const roundTimes = roundSlotTimes.map((time) => time.getTime());
	return sorted.flatMap((assignment, index): ScheduleItem[] => {
		const previous = sorted[index - 1];
		const item = { kind: "assignment" as const, assignment };
		if (!previous || previous.table.roundId !== assignment.table.roundId) {
			return [item];
		}
		const { presentationMinutes, changeoverMinutes } = assignment.table.round;
		if (presentationMinutes === null) return [item];
		const slotMs = (presentationMinutes + changeoverMinutes) * 60_000;
		const from = previous.startsAt.getTime();
		const to = assignment.startsAt.getTime();
		const times = [
			...new Set([
				from,
				...roundTimes.filter((time) => time > from && time < to),
				to
			])
		].sort((a, b) => a - b);

		const gaps: ScheduleItem[] = [];
		times.slice(0, -1).forEach((time, step) => {
			const next = times[step + 1] ?? to;
			const last = gaps.at(-1);
			if (time !== from) {
				// Back-to-back empty slots read as one stretch of free time.
				if (last?.kind === "free" && last.endsAt.getTime() === time) {
					last.endsAt = new Date(time + slotMs);
				} else {
					gaps.push({
						kind: "free",
						startsAt: new Date(time),
						endsAt: new Date(time + slotMs)
					});
				}
			}
			if (next - time > slotMs) {
				gaps.push({
					kind: "break",
					startsAt: new Date(time + slotMs),
					endsAt: new Date(next)
				});
			}
		});
		return [...gaps, item];
	});
}

// The final round has no scorecards: each judge ranks their top finalists.
export function getBallotPlace(assignment: JudgeAssignment) {
	return assignment.votes[0]?.place;
}

export function hasSubmittedBallot(finalists: JudgeAssignment[]) {
	return finalists.some((assignment) => assignment.votes.length > 0);
}

// Ranking opens when the final round starts and closes once scores are released.
export function getRankingState(
	round: JudgeAssignment["table"]["round"],
	currentTime: Date,
	scoresReleased: boolean
) {
	if (scoresReleased) return "closed";
	return round.startTime <= currentTime ? "open" : "upcoming";
}

// The final round is ranked instead, so only panel teams have scorecards.
export function getAssignmentCriteria(
	assignment: JudgeAssignment,
	criteria: Criterion[]
) {
	return assignment.table.round.kind === "panel" ? criteria : [];
}

export function isAssignmentScored(
	assignment: JudgeAssignment,
	criteria: Criterion[]
) {
	const applicable = getAssignmentCriteria(assignment, criteria);
	return (
		applicable.length > 0 &&
		applicable.every((criterion) =>
			assignment.scores.some(
				(score) =>
					score.criteriaId === criterion.id &&
					isCriterionScoreValid(criterion, score.value)
			)
		)
	);
}

export function isCriterionScoreValid(
	criterion: Criterion,
	value: number | undefined
) {
	return (
		value !== undefined &&
		Number.isInteger(value) &&
		value >= 1 &&
		value <= criterion.maxScore
	);
}

export function isScorecardComplete(
	criteria: Criterion[],
	scores: Record<string, number>
) {
	return criteria.every((criterion) =>
		isCriterionScoreValid(criterion, scores[criterion.id])
	);
}

export function getAssignmentScoreStatus(
	assignment: JudgeAssignment,
	criteria: Criterion[]
) {
	if (isAssignmentScored(assignment, criteria)) return "Scores recorded";
	const applicableIds = new Set(
		getAssignmentCriteria(assignment, criteria).map((criterion) => criterion.id)
	);
	return assignment.scores.some((score) => applicableIds.has(score.criteriaId))
		? "Partially scored"
		: "Not scored";
}

export function getAssignmentTotal(
	assignment: JudgeAssignment,
	criteria: Criterion[],
	includeSidepots = false
) {
	const selectedCriteria = getAssignmentCriteria(assignment, criteria).filter(
		(criterion) => includeSidepots || !criterion.isSidepot
	);
	const selectedIds = new Set(
		selectedCriteria.map((criterion) => criterion.id)
	);
	const total = assignment.scores.reduce(
		(sum, score) => sum + (selectedIds.has(score.criteriaId) ? score.value : 0),
		0
	);
	const max = selectedCriteria.reduce(
		(sum, criterion) => sum + criterion.maxScore,
		0
	);
	return { max, total };
}

export function getCriterionDescription(criterion: Criterion) {
	if (criterion.description.trim()) return criterion.description;
	return criterion.isSidepot
		? `Assess how well this project meets the ${criterion.name} sidepot and whether the execution is clear, meaningful, and complete.`
		: `Evaluate how strongly this project demonstrates ${criterion.name.toLowerCase()} and how clearly that strength supports the team’s overall solution.`;
}

export function getScoreOptions(criterion: Criterion) {
	return Array.from(
		{ length: Math.max(0, criterion.maxScore) },
		(_, index) => index + 1
	);
}
