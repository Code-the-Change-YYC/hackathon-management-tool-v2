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
