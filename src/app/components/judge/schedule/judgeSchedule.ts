import { formatDateKey } from "@/lib/datetime";
import {
	type Criterion,
	isAssignmentScored,
	type JudgeAssignment,
	sortAssignments
} from "../judgePortal";

export function groupScheduleByDate(assignments: JudgeAssignment[]) {
	const groups = new Map<string, JudgeAssignment[]>();
	for (const assignment of assignments.slice().sort(sortAssignments)) {
		if (!assignment.timeSlot) continue;
		const key = formatDateKey(assignment.timeSlot);
		const group = groups.get(key);
		if (group) group.push(assignment);
		else groups.set(key, [assignment]);
	}
	return Array.from(groups.values());
}

export function getScheduleRounds(
	rounds: JudgeAssignment["room"]["round"][],
	assignments: JudgeAssignment[]
) {
	// Assignment metadata keeps a newly assigned round visible between refreshes.
	const byId = new Map(
		[...assignments.map((assignment) => assignment.room.round), ...rounds].map(
			(round) => [round.id, round]
		)
	);
	return [...byId.values()].sort(
		(a, b) =>
			a.startTime.getTime() - b.startTime.getTime() || a.id.localeCompare(b.id)
	);
}

export function getScheduleSummary(
	assignments: JudgeAssignment[],
	criteria: Criterion[],
	activeRoundId: string,
	currentTime: Date
) {
	const outstanding = assignments
		.filter(
			(assignment) =>
				assignment.room.roundId === activeRoundId &&
				!isAssignmentScored(assignment, criteria)
		)
		.sort(sortAssignments);
	return {
		outstandingCount: outstanding.length,
		needsScoring: outstanding.find(
			(assignment) => !assignment.timeSlot || assignment.timeSlot <= currentTime
		),
		nextScheduled: outstanding.find(
			(assignment) => assignment.timeSlot && assignment.timeSlot > currentTime
		)
	};
}
