import { PROGRAMS } from "@/lib/validation/signup";
import { type Program, Role } from "@/types/types";

export type Participant = {
	id: string;
	firstName: string | null;
	lastName: string | null;
	email: string;
	role: Role | null;
	teamName: string | null;
	signedUpAt: Date;
	emailVerified: boolean;
	completedRegistration: boolean;
	institution: string | null;
	major: Program | null;
	registeredForFood: boolean | null;
};

export type FoodFilter = "registered" | "not-registered";

export type EmailVerifiedFilter = "verified" | "not-verified";

export type RegistrationFilter = "completed" | "not-completed";

export type ParticipantFilters = {
	roles: Role[];
	food: FoodFilter[];
	emailVerified: EmailVerifiedFilter[];
	registration: RegistrationFilter[];
	institutions: string[];
	majors: Program[];
};

export type SortOption = "role-asc" | "role-desc" | "name-asc" | "name-desc";

export const EMPTY_FILTERS: ParticipantFilters = {
	roles: [],
	food: [],
	emailVerified: [],
	registration: [],
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

export const EMAIL_VERIFIED_OPTIONS: {
	value: EmailVerifiedFilter;
	label: string;
}[] = [
	{ value: "verified", label: "Email verified" },
	{ value: "not-verified", label: "Email not verified" }
];

export const REGISTRATION_OPTIONS: {
	value: RegistrationFilter;
	label: string;
}[] = [
	{ value: "completed", label: "Completed registration" },
	{ value: "not-completed", label: "Not completed registration" }
];

export const INSTITUTION_OPTIONS = [
	"Mount Royal University",
	"University of Calgary",
	"SAIT",
	"Other"
];

export const MAJOR_OPTIONS = PROGRAMS;

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
