// Explicitly controlled by organizers; time alone never advances judging.
export const JUDGING_PHASES = [
	"not_started",
	"submissions_closed",
	"review",
	"judging",
	"deliberation",
	"results_ready",
	"winners_announced"
] as const;
export type JudgingPhase = (typeof JUDGING_PHASES)[number];
export const JUDGING_PHASE_LABELS: Record<JudgingPhase, string> = {
	not_started: "Judging has not started",
	submissions_closed: "Submissions close",
	review: "Submission review",
	judging: "Judging",
	deliberation: "Deliberation",
	results_ready: "Results ready",
	winners_announced: "Winners announced"
};

/** Slot choices offered by the judging UI; the API accepts any positive duration. */
export const SLOT_MINUTES_OPTIONS = [15, 30, 60] as const;
export type SlotMinutes = (typeof SLOT_MINUTES_OPTIONS)[number];

export function getRubricBands(maxScore: number, includeZero = false) {
	const bands = [
		"Minimal",
		"Developing",
		"Satisfactory",
		"Effective",
		"Excellent"
	];
	const minScore = includeZero ? 0 : 1;
	const scoreCount = Math.max(1, maxScore - minScore + 1);
	const activeBands = bands.slice(0, Math.min(bands.length, scoreCount));

	return activeBands.map((label, index) => {
		const start = Math.min(
			maxScore,
			minScore + Math.ceil((index * scoreCount) / activeBands.length)
		);
		const rawEnd =
			minScore + Math.ceil(((index + 1) * scoreCount) / activeBands.length) - 1;
		const end = Math.min(maxScore, Math.max(start, rawEnd));
		return {
			label,
			max: end,
			min: start,
			range: start === end ? `${start}` : `${start}–${end}`
		};
	});
}

export function criterionAppliesToRound(
	criterion: { roundIds?: string[] },
	roundId: string
) {
	return !criterion.roundIds?.length || criterion.roundIds.includes(roundId);
}
