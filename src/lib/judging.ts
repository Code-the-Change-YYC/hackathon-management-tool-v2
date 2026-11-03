import { addMinutes } from "date-fns";

// Only winners_announced is read: it releases scores to participants. Their
// judging stages otherwise follow the clock, pre-screening and scoring.
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

// There is one panel round, which splits judges into tables and is scored on
// the rubric, and one final round, where every judge ranks the finalists.
export const JUDGING_ROUND_KINDS = ["panel", "final"] as const;
export type JudgingRoundKind = (typeof JUDGING_ROUND_KINDS)[number];

// Sidepot criteria keep their own configurable maximum.
export const MAIN_CRITERION_MAX_SCORE = 5;

// Generated panel presentations (Q&A included) must fit this range.
export const MIN_PRESENTATION_MINUTES = 5;
export const MAX_PRESENTATION_MINUTES = 10;

export const DEFAULT_FINALIST_COUNT = 5;

// Each final-round ballot ranks this many finalists, or every finalist when
// there are fewer.
export const BALLOT_PLACES = 3;

export function getBallotPlaces(finalistCount: number) {
	return Math.min(BALLOT_PLACES, finalistCount);
}

// 1st place earns 3 points, 2nd 2 and 3rd 1.
export function getBallotPoints(place: number) {
	return BALLOT_PLACES + 1 - place;
}

export function formatPlace(place: number) {
	return ["1st", "2nd", "3rd"][place - 1] ?? `${place}th`;
}

export type FinalRoundTiming = {
	startTime: Date;
	presentationMinutes: number;
	changeoverMinutes: number;
};

// Finalists present back to back, from the final round's start.
export function getFinalistStartTime(timing: FinalRoundTiming, index: number) {
	return addMinutes(
		timing.startTime,
		index * (timing.presentationMinutes + timing.changeoverMinutes)
	);
}

// Finalists present back to back from the final round's start. Before they're
// picked, the round is sized for the default finalist count.
export function getFinalRoundEndTime({
	startTime,
	finalistCount,
	presentationMinutes,
	changeoverMinutes
}: {
	startTime: Date;
	finalistCount: number;
	presentationMinutes: number;
	changeoverMinutes: number;
}) {
	const count = finalistCount || DEFAULT_FINALIST_COUNT;
	return addMinutes(
		startTime,
		count * (presentationMinutes + changeoverMinutes) - changeoverMinutes
	);
}

// Teams are asked to arrive this long before their first presentation.
export const ARRIVAL_BUFFER_MINUTES = 10;

const RUBRIC_BAND_LABELS = [
	"Minimal",
	"Developing",
	"Satisfactory",
	"Effective",
	"Excellent"
] as const;
export type RubricBandLabel = (typeof RUBRIC_BAND_LABELS)[number];

export function getRubricBands(maxScore: number, includeZero = false) {
	const minScore = includeZero ? 0 : 1;
	const scoreCount = Math.max(1, maxScore - minScore + 1);
	const activeBands = RUBRIC_BAND_LABELS.slice(
		0,
		Math.min(RUBRIC_BAND_LABELS.length, scoreCount)
	);

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
