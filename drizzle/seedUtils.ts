import { TZDate } from "@date-fns/tz";
import { addDays, setHours, setMinutes, startOfHour } from "date-fns";
import { CALGARY_TIME_ZONE } from "@/lib/datetime";

// Hours are Calgary wall-clock times.
export function getEventDate(dayOffset: number, hour: number, minute = 0) {
	const today = new TZDate(Date.now(), CALGARY_TIME_ZONE);
	const date = addDays(
		setMinutes(startOfHour(setHours(today, hour)), minute),
		dayOffset
	);
	return new Date(date.getTime());
}

// A seeded generator (mulberry32), so every run creates the same people and teams.
export function createRandom(seed: number) {
	let state = seed;
	const next = () => {
		state = (state + 0x6d2b79f5) | 0;
		let value = Math.imul(state ^ (state >>> 15), state | 1);
		value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
		return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
	};
	const int = (min: number, max: number) =>
		min + Math.floor(next() * (max - min + 1));
	const pick = <T>(items: readonly T[]) => {
		const item = items[Math.floor(next() * items.length)];
		if (item === undefined) throw new Error("Cannot pick from an empty list.");
		return item;
	};

	return {
		next,
		int,
		pick,
		chance: (probability: number) => next() < probability,
		weighted: <T>(options: readonly (readonly [T, number])[]) => {
			const total = options.reduce((sum, [, weight]) => sum + weight, 0);
			let target = next() * total;
			for (const [option, weight] of options) {
				target -= weight;
				if (target < 0) return option;
			}
			throw new Error("Weights must be positive.");
		},
		shuffle: <T>(items: readonly T[]) => {
			const shuffled = [...items];
			for (let index = shuffled.length - 1; index > 0; index--) {
				const swapIndex = int(0, index);
				const item = shuffled[index] as T;
				shuffled[index] = shuffled[swapIndex] as T;
				shuffled[swapIndex] = item;
			}
			return shuffled;
		}
	};
}

export type Random = ReturnType<typeof createRandom>;
