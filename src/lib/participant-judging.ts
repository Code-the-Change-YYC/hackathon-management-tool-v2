import type { JudgingPhase } from "./participant-events";

export type JudgingRound = {
	id: string;
	name: string;
	startTime: Date;
	endTime: Date;
};
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
