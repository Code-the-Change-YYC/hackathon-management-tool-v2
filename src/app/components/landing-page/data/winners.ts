import { getFields, getNumber, getString } from "@/lib/contentful";
import type { PastHackathonWinner } from "@/types/contentfulTypes";

export function mapPastHackathonWinners(
	entries: readonly PastHackathonWinner[]
): PastHackathonWinner[] {
	const winners = entries.filter((entry) =>
		(getString(getFields(entry).projectName) ?? "").trim()
	);

	// current hackathon year
	const getYear = (entry: PastHackathonWinner): number => {
		const fields = getFields(entry);
		const hackathonName = getString(fields.hackathonName) ?? "";

		return Number(hackathonName.match(/\d{4}/)?.[0] ?? 0);
	};

	// extract team ranking
	const getRanking = (entry: PastHackathonWinner): number => {
		const fields = getFields(entry);

		return getNumber(fields.teamRanking) ?? Infinity;
	};

	// group winners by year
	const grouped = new Map<number, PastHackathonWinner[]>();

	for (const winner of winners) {
		const year = getYear(winner);

		if (!grouped.has(year)) {
			grouped.set(year, []);
		}

		grouped.get(year)?.push(winner);
	}

	// Sort years newest to oldest
	const years = [...grouped.keys()].sort((a, b) => b - a);

	// Sort winners within each year by ranking
	for (const year of years) {
		grouped.get(year)?.sort((a, b) => getRanking(a) - getRanking(b));
	}

	// flatten newest to oldest
	const ordered = years.flatMap((year) => grouped.get(year));

	// place the highest-ranked winner of the newest year in the center, with remaining winners alternating around it.
	const result: PastHackathonWinner[] = [];

	for (let i = 0; i < ordered.length; i++) {
		const winner = ordered[i];

		if (!winner) continue;

		if (i === 0) {
			result.push(winner);
		} else if (i % 2 === 1) {
			result.unshift(winner);
		} else {
			result.push(winner);
		}
	}

	return result;
}
