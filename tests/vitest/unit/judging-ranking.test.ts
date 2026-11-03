import { describe, expect, it } from "vitest";
import { rankFinalists, rankPanelTeams } from "@/lib/judging-ranking";

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

describe("rankFinalists", () => {
	const ballot = (first: string, second: string, third: string) => [
		{ teamId: first, place: 1 },
		{ teamId: second, place: 2 },
		{ teamId: third, place: 3 }
	];
	const noPanelScores = new Map<string, number>();

	it("gives 3 points for 1st, 2 for 2nd and 1 for 3rd", () => {
		const ranking = rankFinalists(
			["a", "b", "c", "d", "e"],
			[...ballot("a", "b", "c"), ...ballot("b", "a", "d")],
			noPanelScores
		);
		expect(
			ranking.map(({ teamId, points, rank }) => [teamId, points, rank])
		).toEqual([
			["a", 5, 1],
			["b", 5, 1],
			["c", 1, 3],
			["d", 1, 3],
			["e", 0, 5]
		]);
		expect(ranking[0]?.placeVotes).toEqual([1, 1, 0]);
	});

	it("breaks a points tie with 1st-place votes, then the panel score", () => {
		// a and b both have 6 points, but only a has 1st-place votes.
		const ranking = rankFinalists(
			["a", "b", "c", "d"],
			[
				...ballot("a", "b", "c"),
				...ballot("a", "b", "d"),
				...ballot("c", "b", "d")
			],
			new Map([
				["b", 1],
				["a", -1]
			])
		);
		expect(ranking.map(({ teamId, points }) => [teamId, points])).toEqual([
			["a", 6],
			["b", 6],
			["c", 4],
			["d", 2]
		]);

		const panelTie = rankFinalists(
			["a", "b"],
			[
				{ teamId: "a", place: 1 },
				{ teamId: "b", place: 1 }
			],
			new Map([
				["a", -0.2],
				["b", 0.4]
			])
		);
		expect(
			panelTie.map(({ teamId, rank, tied }) => [teamId, rank, tied])
		).toEqual([
			["b", 1, false],
			["a", 2, false]
		]);
	});

	it("flags a tie left after every tiebreaker only when it decides a top place", () => {
		const ranking = rankFinalists(
			["a", "b", "c", "d", "e"],
			[...ballot("a", "b", "c"), ...ballot("a", "c", "b")],
			noPanelScores
		);
		expect(
			ranking.map(({ teamId, rank, tied }) => [teamId, rank, tied])
		).toEqual([
			["a", 1, false],
			["b", 2, true],
			["c", 2, true],
			["d", 4, false],
			["e", 4, false]
		]);
	});
});
