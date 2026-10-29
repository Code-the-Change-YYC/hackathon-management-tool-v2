import { addMinutes, differenceInMinutes } from "date-fns";
import { formatTime as formatClockTime, formatLongDate } from "@/lib/datetime";
import { criterionAppliesToRound } from "@/lib/judging";
import type { RouterOutputs } from "@/trpc/react";

export type JudgeAssignment =
	RouterOutputs["judgingAssignments"]["getByJudge"][number];
export type Criterion = Omit<
	RouterOutputs["criteria"]["getAll"][number],
	"roundIds"
> & { roundIds?: string[] };

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

export function formatDate(value?: Date | null) {
	return value ? formatLongDate(value) : "Unscheduled";
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
	return assignment.startsAt <= currentTime;
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
		name:
			first.table.round.kind === "final"
				? "the final table"
				: getTableName(first),
		otherJudges: first.table.judges
			.filter(({ judge }) => judge.id !== userId)
			.map(({ judge }) => judge.name)
	};
}

export type ScheduleItem =
	| { kind: "assignment"; assignment: JudgeAssignment }
	| { kind: "break"; startsAt: Date; endsAt: Date };

// A gap longer than one slot between a table's presentations is free time.
export function withBreaks(assignments: JudgeAssignment[]): ScheduleItem[] {
	const sorted = assignments.slice().sort(sortAssignments);
	return sorted.flatMap((assignment, index): ScheduleItem[] => {
		const previous = sorted[index - 1];
		const item = { kind: "assignment" as const, assignment };
		if (!previous || previous.table.roundId !== assignment.table.roundId) {
			return [item];
		}
		const { presentationMinutes, changeoverMinutes } = assignment.table.round;
		if (presentationMinutes === null) return [item];
		const slotEnd = addMinutes(
			previous.startsAt,
			presentationMinutes + changeoverMinutes
		);
		return assignment.startsAt > slotEnd
			? [
					{
						kind: "break",
						startsAt: getPresentationEnd(previous),
						endsAt: assignment.startsAt
					},
					item
				]
			: [item];
	});
}

export function getCriteriaScore(
	assignment: JudgeAssignment,
	criterionId: string
) {
	return assignment.scores.find((score) => score.criteriaId === criterionId)
		?.value;
}

export function getAssignmentCriteria(
	assignment: JudgeAssignment,
	criteria: Criterion[]
) {
	return criteria.filter((criterion) =>
		criterionAppliesToRound(criterion, assignment.table.roundId)
	);
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
		value >= (criterion.isSidepot ? 0 : 1) &&
		value <= criterion.maxScore
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

export function canScoreAssignment(
	assignment: JudgeAssignment,
	criteria: Criterion[],
	currentTime: Date
) {
	return (
		isAssignmentScored(assignment, criteria) ||
		isScoringOpen(assignment, currentTime)
	);
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

export function getScoreTone(value: number, max: number) {
	const percent = max > 0 ? value / max : 0;
	if (percent >= 0.75) {
		return "border-[#c8efbd] bg-[#eefbe9] text-[#317d15]";
	}
	if (percent >= 0.5) {
		return "border-[#ffe5b2] bg-[#fff8e8] text-[#9f630b]";
	}
	if (percent >= 0.3) {
		return "border-[#ffd2c9] bg-[#fff1ee] text-orange-800";
	}
	return "border-[#f6c8d6] bg-[#fff0f4] text-[#a70a38]";
}

export function hasDraftScore(
	scores: Record<string, number>,
	criterionId: string
) {
	return Object.hasOwn(scores, criterionId);
}

export function getDraftScore(
	scores: Record<string, number>,
	criterionId: string
) {
	return hasDraftScore(scores, criterionId) ? scores[criterionId] : undefined;
}

export function getScoreTextColor(value: number, max: number) {
	const percent = max > 0 ? value / max : 0;
	if (percent >= 0.75) return "text-judging-success-foreground";
	if (percent >= 0.5) return "text-[#317d15]";
	if (percent >= 0.3) return "text-[#9f630b]";
	if (percent >= 0.15) return "text-orange-800";
	return "text-[#a70a38]";
}

export function getScoreFillClass(value: number, max: number) {
	const percent = max > 0 ? value / max : 0;
	if (percent >= 0.75) return "bg-judging-success-foreground text-white";
	if (percent >= 0.5) return "bg-[#317d15] text-white";
	if (percent >= 0.3) return "bg-[#9f630b] text-white";
	if (percent >= 0.15) return "bg-orange-800 text-white";
	return "bg-[#a70a38] text-white";
}

export function getCriterionDescription(criterion: Criterion) {
	if (criterion.description.trim()) return criterion.description;
	return criterion.isSidepot
		? `Assess how well this project meets the ${criterion.name} sidepot and whether the execution is clear, meaningful, and complete.`
		: `Evaluate how strongly this project demonstrates ${criterion.name.toLowerCase()} and how clearly that strength supports the team’s overall solution.`;
}

export function getBandDescription(criterion: Criterion, label: string) {
	return criterion.isSidepot
		? `Use this range when the ${criterion.name} sidepot shows ${label.toLowerCase()} evidence, execution, and relevance.`
		: `Use this range when the project shows ${label.toLowerCase()} evidence for ${criterion.name.toLowerCase()}.`;
}

export function getScoreOptions(
	criterion: Criterion,
	includeZero: boolean,
	currentScore?: number
) {
	const maxScore = criterion.maxScore;
	const start = includeZero || currentScore === 0 ? 0 : 1;
	return Array.from(
		{ length: Math.max(0, maxScore - start + 1) },
		(_, index) => start + index
	);
}
