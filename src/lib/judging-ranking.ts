import { BALLOT_PLACES, getBallotPoints } from "@/lib/judging";

export type PanelScorecard = {
	teamId: string;
	judgeId: string;
	score: number;
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

// Each judge's scores become z-scores against that judge's own scores, so a
// lenient or strict table doesn't decide who reaches the final.
export function rankPanelTeams(
	scorecards: PanelScorecard[]
): PanelRankingEntry[] {
	const scoresByJudge = new Map<string, number[]>();
	for (const card of scorecards) {
		scoresByJudge.set(card.judgeId, [
			...(scoresByJudge.get(card.judgeId) ?? []),
			card.score
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

	const cardsByTeam = new Map<string, PanelScorecard[]>();
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
					return (card.score - stats.mean) / stats.deviation;
				})
			),
			rawAverage: average(cards.map((card) => card.score)),
			scorecardCount: cards.length
		}))
		.sort(
			(a, b) =>
				b.normalizedScore - a.normalizedScore || b.rawAverage - a.rawAverage
		);
}

export type FinalVote = {
	teamId: string;
	place: number;
};

export type FinalRankingEntry = {
	teamId: string;
	points: number;
	// Each place's vote count, from 1st.
	placeVotes: number[];
	panelScore: number | null;
	rank: number;
	// Still level after every tiebreaker, where it decides a top place.
	tied: boolean;
};

// A finalist without a panel score ranks below one with a score.
function comparePanelScores(a: number | null, b: number | null) {
	if (a === b) return 0;
	if (a === null) return 1;
	if (b === null) return -1;
	return b - a;
}

function compareFinalists(a: FinalRankingEntry, b: FinalRankingEntry) {
	return (
		b.points - a.points ||
		(b.placeVotes[0] ?? 0) - (a.placeVotes[0] ?? 0) ||
		comparePanelScores(a.panelScore, b.panelScore)
	);
}

// Ballot points decide the final. Ties go to more 1st-place votes, then the
// panel round's normalized score; anything still tied is left to the organizers.
export function rankFinalists(
	teamIds: string[],
	votes: FinalVote[],
	panelScores: ReadonlyMap<string, number>
): FinalRankingEntry[] {
	const entries = teamIds
		.map((teamId) => {
			const placeVotes = Array.from(
				{ length: BALLOT_PLACES },
				(_, index) =>
					votes.filter(
						(vote) => vote.teamId === teamId && vote.place === index + 1
					).length
			);
			return {
				teamId,
				points: placeVotes.reduce(
					(sum, count, index) => sum + count * getBallotPoints(index + 1),
					0
				),
				placeVotes,
				panelScore: panelScores.get(teamId) ?? null,
				rank: 0,
				tied: false
			};
		})
		.sort(compareFinalists);

	for (const [index, entry] of entries.entries()) {
		const previous = entries[index - 1];
		entry.rank =
			previous && compareFinalists(previous, entry) === 0
				? previous.rank
				: index + 1;
	}
	for (const entry of entries) {
		entry.tied =
			entry.rank <= BALLOT_PLACES &&
			entries.some((other) => other !== entry && other.rank === entry.rank);
	}
	return entries;
}
