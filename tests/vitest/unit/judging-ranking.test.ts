import { describe, expect, it } from "vitest";
import { rankPanelTeams } from "@/lib/judging-ranking";

describe("rankPanelTeams", () => {
	it("normalizes each judge so a strict table doesn't sink its teams", () => {
		const ranking = rankPanelTeams([
			{ teamId: "a", judgeId: "lenient", score: 10 },
			{ teamId: "b", judgeId: "lenient", score: 8 },
			{ teamId: "c", judgeId: "strict", score: 6 },
			{ teamId: "d", judgeId: "strict", score: 4 }
		]);
		expect(ranking.map((entry) => entry.teamId)).toEqual(["a", "c", "b", "d"]);
		expect(ranking.find((entry) => entry.teamId === "c")).toMatchObject({
			normalizedScore: 1,
			rawAverage: 6,
			scorecardCount: 1
		});
	});

	it("averages a team's z-scores across every judge who scored it", () => {
		const ranking = rankPanelTeams([
			{ teamId: "a", judgeId: "j1", score: 9 },
			{ teamId: "b", judgeId: "j1", score: 5 },
			{ teamId: "a", judgeId: "j2", score: 6 },
			{ teamId: "b", judgeId: "j2", score: 6 }
		]);
		expect(ranking).toEqual([
			{ teamId: "a", normalizedScore: 0.5, rawAverage: 7.5, scorecardCount: 2 },
			{ teamId: "b", normalizedScore: -0.5, rawAverage: 5.5, scorecardCount: 2 }
		]);
	});

	it("treats a judge who gave everyone the same total as neutral", () => {
		expect(rankPanelTeams([{ teamId: "a", judgeId: "j1", score: 7 }])).toEqual([
			{ teamId: "a", normalizedScore: 0, rawAverage: 7, scorecardCount: 1 }
		]);
	});
});
