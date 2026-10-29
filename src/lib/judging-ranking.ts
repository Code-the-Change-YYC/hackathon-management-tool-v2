export type MainScorecard = {
	teamId: string;
	judgeId: string;
	mainScore: number;
};

export type PanelRankingEntry = {
	teamId: string;
	normalizedScore: number;
	rawAverage: number;
	scorecardCount: number;
};

function average(values: number[]) {
	return values.reduce((sum, value) => sum + value, 0) / values.length;
}

// Each judge's totals become z-scores against that judge's own scores, so a
// lenient or strict table doesn't decide who reaches the final.
export function rankPanelTeams(
	scorecards: MainScorecard[]
): PanelRankingEntry[] {
	const scoresByJudge = new Map<string, number[]>();
	for (const card of scorecards) {
		scoresByJudge.set(card.judgeId, [
			...(scoresByJudge.get(card.judgeId) ?? []),
			card.mainScore
		]);
	}

	const statsByJudge = new Map(
		[...scoresByJudge].map(([judgeId, values]) => {
			const mean = average(values);
			const deviation = Math.sqrt(
				average(values.map((value) => (value - mean) ** 2))
			);
			return [judgeId, { mean, deviation }];
		})
	);

	const cardsByTeam = new Map<string, MainScorecard[]>();
	for (const card of scorecards) {
		cardsByTeam.set(card.teamId, [
			...(cardsByTeam.get(card.teamId) ?? []),
			card
		]);
	}

	return [...cardsByTeam]
		.map(([teamId, cards]) => ({
			teamId,
			normalizedScore: average(
				cards.map((card) => {
					const stats = statsByJudge.get(card.judgeId);
					if (!stats || stats.deviation === 0) return 0;
					return (card.mainScore - stats.mean) / stats.deviation;
				})
			),
			rawAverage: average(cards.map((card) => card.mainScore)),
			scorecardCount: cards.length
		}))
		.sort(
			(a, b) =>
				b.normalizedScore - a.normalizedScore || b.rawAverage - a.rawAverage
		);
}
