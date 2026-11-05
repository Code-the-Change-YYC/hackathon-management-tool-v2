import type { RouterOutputs } from "@/trpc/react";

type TeamsData = RouterOutputs["teams"]["getTeamsWithMembers"];
export type Team = TeamsData["teams"][number];
export type TeamRound = TeamsData["rounds"][number];

export type FilterOption =
	| "prescreen"
	| "finalist"
	| "lt-two"
	| `round:${string}`;
export type SortOption = "name-asc" | "name-desc";

export function getFilterOptions(
	rounds: TeamRound[]
): { value: FilterOption; label: string }[] {
	return [
		{ value: "prescreen", label: "Passed pre-screening" },
		...rounds.map((round) => ({
			value: `round:${round.id}` as const,
			label: `Scored in ${round.name}`
		})),
		{ value: "finalist", label: "Finalists" },
		{ value: "lt-two", label: "Less than 2 members" }
	];
}

export const SORT_OPTIONS: { value: SortOption; label: string }[] = [
	{ value: "name-asc", label: "Sort by: name Ascending (A-Z)" },
	{ value: "name-desc", label: "Sort by: name Descending (Z-A)" }
];

export function formatMemberNames(team: Team) {
	return team.members.map((member) => member.name || member.email).join(", ");
}

export function byName(a: Team, b: Team) {
	return a.name.localeCompare(b.name) || a.id.localeCompare(b.id);
}

export const MAX_PRESCREEN_BATCHES = 8;

// Consecutive runs of teams by name, as even in size as possible, so every
// admin who picks the same count sees the same batches.
export function splitIntoBatches(teams: Team[], count: number) {
	const sorted = [...teams].sort(byName);
	return Array.from({ length: count }, (_, index) =>
		sorted.slice(
			Math.floor((index * sorted.length) / count),
			Math.floor(((index + 1) * sorted.length) / count)
		)
	);
}
