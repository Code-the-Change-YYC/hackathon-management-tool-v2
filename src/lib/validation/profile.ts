import {
	isValidPhoneNumber,
	parsePhoneNumberFromString
} from "libphonenumber-js";
import { z } from "zod";
import { isCountryCode } from "@/lib/countries";
import { getNameParts } from "@/lib/names";
import {
	SCHOOL_NAME_MAX_LENGTH,
	SCHOOL_NOT_LISTED,
	UNIVERSITY_OF_CALGARY
} from "@/lib/schools";
import type { Program } from "@/types/types";
import {
	LEVEL_OF_STUDY_LABELS,
	LEVELS_OF_STUDY,
	type LevelOfStudy,
	PROGRAMS
} from "./signup";

export const PROGRAM_LABELS = {
	computer_science: "Computer Science",
	software_engineering: "Software Engineering",
	electrical_engineering: "Electrical Engineering",
	other: "Other"
} satisfies Record<Program, string>;

export const PROGRAM_OPTIONS = PROGRAMS.map((program) => ({
	value: program,
	label: PROGRAM_LABELS[program]
}));

export const LEVEL_OF_STUDY_OPTIONS = LEVELS_OF_STUDY.map((level) => ({
	value: level,
	label: LEVEL_OF_STUDY_LABELS[level]
}));

// MLH asks for an age rather than a date of birth. High school students can
// take part, so the youngest allowed is 13.
export const MIN_AGE = 13;
export const MAX_AGE = 99;

export const NAME_MAX_LENGTH = 50;

/** We only collect a major from University of Calgary students. */
export function asksForMajor(school: string | null | undefined) {
	return school === UNIVERSITY_OF_CALGARY;
}

/** The school a profile form names: the one picked, or the one typed in. */
export function getSchoolName(
	school: string | null | undefined,
	otherSchool: string | undefined
) {
	return school === SCHOOL_NOT_LISTED
		? (otherSchool ?? "").trim()
		: (school ?? "");
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

// The phone input gives numbers in E.164 format, e.g. "+14035550123".
const phoneNumberSchema = z
	.string()
	.trim()
	.min(1, "Phone number is required")
	.refine(isValidPhoneNumber, "Enter a valid phone number");

const requiredChoice = (message: string) => ({
	required_error: message,
	invalid_type_error: message
});

const detailsSchema = z.object({
	firstName: nameSchema("First name"),
	lastName: nameSchema("Last name"),
	// The age field gives a number, or null while it's empty.
	age: z.preprocess(
		(age) => (age === "" || age == null ? undefined : Number(age)),
		z
			.number({
				required_error: "Enter your age",
				invalid_type_error: "Enter your age as a number"
			})
			.int("Enter your age as a whole number")
			.min(MIN_AGE, `Participants must be at least ${MIN_AGE}`)
			.max(MAX_AGE, `Enter an age of ${MAX_AGE} or under`)
	),
	phoneNumber: phoneNumberSchema,
	countryOfResidence: z
		.string(requiredChoice("Select your country of residence"))
		.refine(isCountryCode, "Select your country of residence"),
	levelOfStudy: z.enum(LEVELS_OF_STUDY, {
		errorMap: () => ({ message: "Select your level of study" })
	}),
	program: z.enum(PROGRAMS).nullable()
});

function requireMajorForSchool(
	school: string,
	program: Program | null,
	ctx: z.RefinementCtx
) {
	if (asksForMajor(school) && !program) {
		ctx.addIssue({
			code: z.ZodIssueCode.custom,
			message: "Select your major",
			path: ["program"]
		});
	}
}

/** The details the API saves. By now the school is always a name. */
export const profileSchema = detailsSchema
	.extend({
		school: z
			.string()
			.trim()
			.min(1, "Select your institution")
			.max(
				SCHOOL_NAME_MAX_LENGTH,
				`Institution must be ${SCHOOL_NAME_MAX_LENGTH} characters or fewer`
			)
	})
	.superRefine(({ school, program }, ctx) =>
		requireMajorForSchool(school, program, ctx)
	)
	.transform((profile) => ({
		...profile,
		program: asksForMajor(profile.school) ? profile.program : null
	}));

/**
 * The profile form. The school is picked from MLH's list, or typed in when
 * the participant picks "My school isn't listed".
 */
export const profileFormSchema = detailsSchema
	.extend({
		school: z.string(requiredChoice("Select your institution")),
		otherSchool: z
			.string()
			.trim()
			.max(
				SCHOOL_NAME_MAX_LENGTH,
				`Institution must be ${SCHOOL_NAME_MAX_LENGTH} characters or fewer`
			)
	})
	.superRefine(({ school, otherSchool, program }, ctx) => {
		if (school === SCHOOL_NOT_LISTED && !otherSchool) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: "Enter your institution’s name",
				path: ["otherSchool"]
			});
		}
		requireMajorForSchool(getSchoolName(school, otherSchool), program, ctx);
	})
	.transform(({ school, otherSchool, ...profile }) => {
		const schoolName = getSchoolName(school, otherSchool);
		return {
			...profile,
			school: schoolName,
			program: asksForMajor(schoolName) ? profile.program : null
		};
	});

export type ProfileInput = z.input<typeof profileFormSchema>;
export type ProfileValues = z.output<typeof profileFormSchema>;

type ProfileUser = {
	name: string;
	firstName?: string | null;
	lastName?: string | null;
	age?: number | null;
	phoneNumber?: string | null;
	countryOfResidence?: string | null;
	school?: string | null;
	schoolIsListed: boolean;
	levelOfStudy?: LevelOfStudy | null;
	program?: Program | null;
};

/**
 * Profile form values for a user. Accounts that haven't saved a first and
 * last name yet (e.g. from Google) start from their full name.
 */
export function getProfileDefaults(user: ProfileUser): Partial<ProfileInput> {
	const nameParts = getNameParts(user.name);
	const typedSchool =
		user.school && !user.schoolIsListed ? user.school : undefined;

	return {
		firstName: user.firstName ?? nameParts.firstName,
		lastName: user.lastName ?? nameParts.lastName,
		age: user.age ?? null,
		phoneNumber: toPhoneInputValue(user.phoneNumber),
		countryOfResidence: user.countryOfResidence ?? undefined,
		school: typedSchool ? SCHOOL_NOT_LISTED : (user.school ?? undefined),
		otherSchool: typedSchool ?? "",
		levelOfStudy: user.levelOfStudy ?? undefined,
		program: user.program ?? null
	};
}

/** A saved phone number in the E.164 format the phone input expects. */
function toPhoneInputValue(phoneNumber: string | null | undefined) {
	if (!phoneNumber) return "";
	// Numbers saved without a country code are Canadian.
	return parsePhoneNumberFromString(phoneNumber, "CA")?.number ?? "";
}
