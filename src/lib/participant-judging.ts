import { addMinutes } from "date-fns";
import type { RouterOutputs } from "@/trpc/react";
import type { JudgingPhase, JudgingRoundKind } from "./judging";

export type JudgingRound = {
	id: string;
	name: string;
	kind: JudgingRoundKind;
	startTime: Date;
	endTime: Date;
};

export type TeamJudging = RouterOutputs["judgingAssignments"]["getMine"];

// The first published round whose last presentation hasn't ended yet.
export function getUpcomingJudging(judging: TeamJudging, now: Date) {
	return judging.find(({ round, assignments }) => {
		const last = assignments.at(-1);
		return (
			last && addMinutes(last.startsAt, round.presentationMinutes ?? 0) > now
		);
	});
}
export function judgingStages(
	phase: JudgingPhase,
	rounds: JudgingRound[],
	currentRoundId: string | null
) {
	const ordered = rounds
		.slice()
		.sort(
			(a, b) =>
				a.startTime.getTime() - b.startTime.getTime() ||
				a.id.localeCompare(b.id)
		);
	const active = ordered.findIndex((round) => round.id === currentRoundId);
	const finished = [
		"deliberation",
		"results_ready",
		"winners_announced"
	].includes(phase);
	return [
		{
			id: "submissions",
			name: "Submissions close",
			state: phase === "not_started" ? "upcoming" : "completed"
		},
		{
			id: "review",
			name: "Pre-Screening Round",
			state:
				phase === "review"
					? "current"
					: phase === "judging" || finished
						? "completed"
						: "upcoming"
		},
		...ordered.map((round, index) => ({
			id: round.id,
			name: round.name,
			state:
				finished || (phase === "judging" && active >= 0 && index < active)
					? "completed"
					: phase === "judging" && round.id === currentRoundId
						? "current"
						: "upcoming"
		})),
		{
			id: "winners",
			name: "Winners announcement",
			state: phase === "winners_announced" ? "completed" : "upcoming"
		}
	] as {
		id: string;
		name: string;
		state: "upcoming" | "current" | "completed";
	}[];
}
