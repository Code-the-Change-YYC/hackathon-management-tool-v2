import { getFields, getNumber, getString } from "@/lib/contentful";
import type { PastHackathonWinner } from "@/types/contentfulTypes";

function compareWinners(
	left: PastHackathonWinner,
	right: PastHackathonWinner
): number {
	const leftFields = getFields(left);
	const rightFields = getFields(right);
	const leftRanking =
		getNumber(leftFields.teamRanking) ?? Number.POSITIVE_INFINITY;
	const rightRanking =
		getNumber(rightFields.teamRanking) ?? Number.POSITIVE_INFINITY;

	if (leftRanking !== rightRanking) {
		return leftRanking - rightRanking;
	}
	const [awardNameLeft, awardNameRight] = [
		getString(leftFields.awardName)?.trim() ?? "",
		getString(rightFields.awardName)?.trim() ?? ""
	];
	const awardComparison = awardNameLeft.localeCompare(awardNameRight);
	if (awardComparison !== 0) {
		return awardComparison;
	}

	return (getString(leftFields.projectName) ?? "").localeCompare(
		getString(rightFields.projectName) ?? ""
	);
}

export function mapPastHackathonWinners(
	entries: readonly PastHackathonWinner[]
): PastHackathonWinner[] {
	return entries
		.filter((entry) => (getString(getFields(entry).projectName) ?? "").trim())
		.slice()
		.sort(compareWinners);
}
