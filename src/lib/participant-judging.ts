import { addMinutes } from "date-fns";
import type { PrescreenStatus } from "@/types/types";
import { formatLongDate, formatTime } from "./datetime";
import { ARRIVAL_BUFFER_MINUTES, type JudgingRoundKind } from "./judging";

export type JudgingRound = {
	id: string;
	name: string;
	kind: JudgingRoundKind;
	startTime: Date;
	endTime: Date;
};

// A published round's presentations for one team, in order.
export type TeamJudgingRound = {
	round: {
		id: string;
		name: string;
		kind: JudgingRoundKind;
		startTime: Date;
		presentationMinutes: number | null;
		publishedAt: Date | null;
	};
	assignments: { id: string; tableNumber: number; startsAt: Date }[];
};

export type TeamJudging = TeamJudgingRound[];

// Everything participants need to follow judging, independent of their team.
export type JudgingProgress = {
	startDate: Date | null;
	submissionDeadline: Date | null;
	// Every team has passed or failed pre-screening.
	prescreenComplete: boolean;
	// scoringComplete: every judge has scored every team in the round.
	rounds: (JudgingRound & { scoringComplete: boolean })[];
	scoresReleased: boolean;
};

export type TeamJudgingStatus = {
	team: {
		name: string;
		prescreen: PrescreenStatus;
		// Only sent when the team failed pre-screening.
		feedback: string | null;
	} | null;
	// Published rounds the team presents in. scored: every judge at the team's
	// tables has scored it.
	rounds: (TeamJudgingRound & { scored: boolean })[];
	finalPublished: boolean;
};

export function sortRounds<Round extends JudgingRound>(rounds: Round[]) {
	return rounds
		.slice()
		.sort(
			(a, b) =>
				a.startTime.getTime() - b.startTime.getTime() ||
				a.id.localeCompare(b.id)
		);
}

export function presentationsEnd({ round, assignments }: TeamJudgingRound) {
	const last = assignments.at(-1);
	return last
		? addMinutes(last.startsAt, round.presentationMinutes ?? 0)
		: null;
}

// The first published round whose last presentation hasn't ended yet.
export function getUpcomingJudging(judging: TeamJudging, now: Date) {
	return judging.find((entry) => {
		const end = presentationsEnd(entry);
		return end !== null && end > now;
	});
}

function formatMinutes(minutes: number) {
	return `${minutes} minute${minutes === 1 ? "" : "s"}`;
}

export function describeJudgingSchedule({
	round,
	assignments
}: TeamJudgingRound) {
	const first = assignments[0];
	if (!first) return "";
	const arriveBy = `Arrive by ${formatTime(addMinutes(first.startsAt, -ARRIVAL_BUFFER_MINUTES))}.`;
	const minutes = formatMinutes(round.presentationMinutes ?? 0);
	if (round.kind === "final")
		return `${arriveBy} Present to every judge at ${formatTime(first.startsAt)}. You have ${minutes}, including Q&A.`;
	const tables = assignments
		.map(
			(assignment) =>
				`Table ${assignment.tableNumber} at ${formatTime(assignment.startsAt)}`
		)
		.join(", then ");
	return `${arriveBy} Present at ${tables}. You have ${minutes} per presentation, including Q&A.`;
}

export type JudgingStageState = "completed" | "current" | "upcoming";

export type JudgingStage = {
	id: string;
	name: string;
	description: string;
	state: JudgingStageState;
};

function hasPassed(date: Date | null, now: Date) {
	return date !== null && date <= now;
}

function submissionsDescription(deadline: Date | null, closed: boolean) {
	if (!deadline)
		return "Submit your project before the deadline to take part in judging.";
	const when = `${formatTime(deadline)} on ${formatLongDate(deadline)}`;
	return closed
		? `Submissions closed at ${when}.`
		: `Submit your project by ${when}.`;
}

// Submissions follow the clock. Pre-screening and each round complete once
// every team is decided or scored, and winners once scores are released.
export function judgingStages(
	progress: JudgingProgress,
	now: Date
): JudgingStage[] {
	const { startDate, submissionDeadline, prescreenComplete, scoresReleased } =
		progress;
	const submissionsClosed = hasPassed(submissionDeadline, now);

	function submissionsState(): JudgingStageState {
		if (submissionsClosed) return "completed";
		return hasPassed(startDate, now) ? "current" : "upcoming";
	}

	function prescreenState(): JudgingStageState {
		if (!submissionsClosed) return "upcoming";
		return prescreenComplete ? "completed" : "current";
	}

	function roundState(
		round: JudgingProgress["rounds"][number]
	): JudgingStageState {
		if (round.startTime > now) return "upcoming";
		return round.scoringComplete ? "completed" : "current";
	}

	const roundStages: JudgingStage[] = sortRounds(progress.rounds).map(
		(round) => ({
			id: round.id,
			name: round.name,
			description: `${formatLongDate(round.startTime)}, ${formatTime(round.startTime)} – ${formatTime(round.endTime)}`,
			state: roundState(round)
		})
	);

	function winnersState(): JudgingStageState {
		if (scoresReleased) return "completed";
		const roundsComplete =
			roundStages.length > 0 &&
			roundStages.every((stage) => stage.state === "completed");
		return roundsComplete ? "current" : "upcoming";
	}

	return [
		{
			id: "submissions",
			name: "Submissions close",
			description: submissionsDescription(
				submissionDeadline,
				submissionsClosed
			),
			state: submissionsState()
		},
		{
			id: "prescreen",
			name: "Pre-Screening Round",
			description:
				"Projects are checked against the submission requirements before live judging.",
			state: prescreenState()
		},
		...roundStages,
		{
			id: "winners",
			name: "Winners announcement",
			description:
				"Results are published once judging and deliberation wrap up.",
			state: winnersState()
		}
	];
}
