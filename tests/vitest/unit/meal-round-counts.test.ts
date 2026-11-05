import { describe, expect, it } from "vitest";
import { mealRoundCounts } from "@/lib/meal-round-counts";

const scans = (...ids: string[]) => ids.map((id) => ({ user: { id } }));

describe("meal scan rounds", () => {
	it("counts each participant once per round, regardless of scan order", () => {
		const rounds = mealRoundCounts(scans("a", "b", "a", "c", "a", "b"));
		expect(rounds).toEqual([3, 2, 1]);
		expect(rounds.reduce((total, count) => total + count, 0)).toBe(6);
		expect(
			rounds.map((_, index) =>
				rounds.slice(0, index + 1).reduce((sum, count) => sum + count, 0)
			)
		).toEqual([3, 5, 6]);
	});

	it("handles a single round and no scans", () => {
		expect(mealRoundCounts(scans("a", "b"))).toEqual([2]);
		expect(mealRoundCounts([])).toEqual([]);
	});
});
