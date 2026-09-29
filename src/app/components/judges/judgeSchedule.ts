import { type JudgeAssignment, sortAssignments } from "./judgePortal";

export function inferDuration(
	assignment: JudgeAssignment,
	assignments: JudgeAssignment[]
) {
	const assignmentTime = assignment.timeSlot;
	if (!assignmentTime) return 20;
	const nextAssignment = assignments
		.filter(
			(candidate) =>
				candidate.room.id === assignment.room.id &&
				candidate.timeSlot &&
				candidate.timeSlot > assignmentTime
		)
		.sort(sortAssignments)[0];

	if (!nextAssignment?.timeSlot) return 20;
	const minutes = Math.round(
		(nextAssignment.timeSlot.getTime() - assignmentTime.getTime()) / 60_000
	);
	if (minutes <= 0 || minutes > 120) return 20;
	return minutes;
}

export function groupScheduleByDate(assignments: JudgeAssignment[]) {
	const groups = new Map<string, JudgeAssignment[]>();
	for (const assignment of assignments.slice().sort(sortAssignments)) {
		if (!assignment.timeSlot) continue;
		const key = assignment.timeSlot.toDateString();
		const group = groups.get(key);
		if (group) group.push(assignment);
		else groups.set(key, [assignment]);
	}
	return Array.from(groups.values());
}
