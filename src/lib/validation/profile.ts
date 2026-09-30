import { z } from "zod";
import { getNameParts } from "@/lib/names";
import type { Program } from "@/types/types";
import { PROGRAMS, SCHOOLS } from "./signup";

export type School = (typeof SCHOOLS)[number];

export const UNIVERSITY_OF_CALGARY = "University of Calgary" satisfies School;

export const PROGRAM_LABELS = {
	computer_science: "Computer Science",
	software_engineering: "Software Engineering",
	electrical_engineering: "Electrical Engineering",
	other: "Other"
} satisfies Record<Program, string>;

export const SCHOOL_OPTIONS = SCHOOLS.map((school) => ({
	value: school,
	label: school
}));

export const PROGRAM_OPTIONS = PROGRAMS.map((program) => ({
	value: program,
	label: PROGRAM_LABELS[program]
}));

export const NAME_MAX_LENGTH = 50;

export function isSchool(value: string | null | undefined): value is School {
	return SCHOOLS.some((school) => school === value);
}

/** We only collect a major from University of Calgary students. */
export function asksForMajor(school: string | null | undefined) {
	return school === UNIVERSITY_OF_CALGARY;
}

const nameSchema = (label: string) =>
	z
		.string()
		.trim()
		.min(1, `${label} is required`)
		.max(
			NAME_MAX_LENGTH,
			`${label} must be ${NAME_MAX_LENGTH} characters or fewer`
		);

export const profileSchema = z
	.object({
		firstName: nameSchema("First name"),
		lastName: nameSchema("Last name"),
		school: z.enum(SCHOOLS, {
			errorMap: () => ({ message: "Select your institution" })
		}),
		program: z.enum(PROGRAMS).nullable()
	})
	.superRefine(({ school, program }, ctx) => {
		if (asksForMajor(school) && !program) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: "Select your major",
				path: ["program"]
			});
		}
	})
	.transform((profile) => ({
		...profile,
		program: asksForMajor(profile.school) ? profile.program : null
	}));

export type ProfileInput = z.input<typeof profileSchema>;
export type ProfileValues = z.output<typeof profileSchema>;

/** Profile form values for a user; an institution we don't list starts blank. */
export function getProfileDefaults(user: {
	name: string;
	school?: string | null;
	program?: Program | null;
}): Partial<ProfileInput> {
	return {
		...getNameParts(user.name),
		school: isSchool(user.school) ? user.school : undefined,
		program: user.program ?? null
	};
}
