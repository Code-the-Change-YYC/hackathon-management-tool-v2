/**
 * This is intentionally decoupled from the database model,
 * like the user types are, so the UI can be built and
 * reviewed before the tRPC routers are wired in.
 */
export type Team = {
	rank: number;
	id: string;
	name: string;
	prescreen: boolean | null;
	feedback: string | null;
	round1: boolean | null;
	round2: "winner" | "sp-winner" | "rejected" | null;
	members: string;
	memberCount: number;
};

export type FilterOption = "prescreen" | "round-one" | "round-two" | "lt-two";
export type SortOption = "rank-asc" | "rank-desc" | "name-asc" | "name-desc";

export const FILTER_OPTIONS: { value: FilterOption; label: string }[] = [
	{ value: "prescreen", label: "Passed pre-screening" },
	{ value: "round-one", label: "Passed round 1 judging" },
	{ value: "round-two", label: "Passed round 2 judging" },
	{ value: "lt-two", label: "Less than 2 members" }
];

export const SORT_OPTIONS: { value: SortOption; label: string }[] = [
	{ value: "rank-asc", label: "Sort by: rank Ascending" },
	{ value: "rank-desc", label: "Sort by: rank Descending" },
	{ value: "name-asc", label: "Sort by: name Ascending (A-Z)" },
	{ value: "name-desc", label: "Sort by: name Descending (Z-A)" }
];
