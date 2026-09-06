import { Role } from "@/types/types";

/**
 * Shape the Registered Users screen renders. This is intentionally decoupled
 * from the database model so the UI can be built and reviewed before the
 * tRPC routers are wired in.
 */
export type Participant = {
	id: string;
	firstName: string;
	lastName: string;
	email: string;
	role: Role;
	teamId: string;
	teamName: string | null;
	institution: string;
	major: string | null;
	registeredForFood: boolean;
};

export type FoodFilter = "registered" | "not-registered";

export type ParticipantFilters = {
	roles: Role[];
	food: FoodFilter[];
	institutions: string[];
	majors: string[];
};

export type SortOption = "role-asc" | "role-desc" | "name-asc" | "name-desc";

export const EMPTY_FILTERS: ParticipantFilters = {
	roles: [],
	food: [],
	institutions: [],
	majors: []
};

export const ROLE_OPTIONS: { value: Role; label: string }[] = [
	{ value: Role.PARTICIPANT, label: "Participant" },
	{ value: Role.JUDGE, label: "Judge" },
	{ value: Role.ADMIN, label: "Admin" }
];

export const FOOD_OPTIONS: { value: FoodFilter; label: string }[] = [
	{ value: "registered", label: "Registered for food" },
	{ value: "not-registered", label: "Not registered for food" }
];

export const INSTITUTION_OPTIONS = [
	"Mount Royal University",
	"University of Calgary",
	"SAIT",
	"Other"
];

export const MAJOR_OPTIONS = [
	"Computer Science",
	"Software Engineering",
	"Other"
];

export const SORT_OPTIONS: { value: SortOption; label: string }[] = [
	{ value: "role-asc", label: "Sort by: role Ascending (A-Z)" },
	{ value: "role-desc", label: "Sort by: role Descending (Z-A)" },
	{ value: "name-asc", label: "Sort by: name Ascending (A-Z)" },
	{ value: "name-desc", label: "Sort by: name Descending (Z-A)" }
];

export const ROLE_LABELS: Record<Role, string> = {
	[Role.PARTICIPANT]: "Participant",
	[Role.JUDGE]: "Judge",
	[Role.ADMIN]: "Admin"
};
