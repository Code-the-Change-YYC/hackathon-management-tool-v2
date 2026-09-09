import { z } from "zod";

export const PROGRAMS = [
	"computer_science",
	"software_engineering",
	"electrical_engineering",
	"other"
] as const;

export const SCHOOLS = [
	"University of Calgary",
	"Mount Royal University",
	"SAIT",
	"Other"
] as const;

export const DIETARY_RESTRICTIONS = [
	"halal",
	"vegetarian",
	"vegan",
	"gluten_free",
	"other"
] as const;

export type DietaryRestriction = (typeof DIETARY_RESTRICTIONS)[number];

export const signupCredentialsSchema = z.object({
	email: z
		.string()
		.min(1, "Email is required")
		.regex(/^\S+@\S+\.\S+$/, "Enter a valid email address"),
	password: z
		.string()
		.min(8, "Use at least 8 characters")
		.regex(/[0-9]/, "Include at least one number")
		.regex(/[^A-Za-z0-9]/, "Include at least one special character")
});

export const signupPersonalDetailsSchema = z.object({
	firstName: z.string().min(1, "First name is required"),
	lastName: z.string().min(1, "Last name is required"),
	school: z.string().min(1, "Select your institution")
});

export const dietaryRestrictionsSchema = z
	.array(z.enum(DIETARY_RESTRICTIONS))
	.max(DIETARY_RESTRICTIONS.length)
	.refine(
		(restrictions) => new Set(restrictions).size === restrictions.length,
		{ message: "Duplicate dietary restrictions are not allowed" }
	);

export function createSignupIdentitySchema(requiresPassword: boolean) {
	return z.object({
		firstName: z.string().min(1, "First name is required"),
		lastName: z.string().min(1, "Last name is required"),
		email: z
			.string()
			.min(1, "Email is required")
			.regex(/^\S+@\S+\.\S+$/, "Enter a valid email address"),
		password: requiresPassword
			? z.string().min(1, "Password is required")
			: z.string()
	});
}

const wantsFoodSchema = z
	.union([z.literal(""), z.enum(["yes", "no"])])
	.refine((value): value is "yes" | "no" => value !== "", {
		message: "Select whether you want provided food"
	});

const programSchema = z
	.union([z.literal(""), z.enum(PROGRAMS)])
	.optional()
	.transform((value) => (value === "" ? undefined : value));

export const signupEventDetailsSchema = z.object({
	school: z.string(),
	program: programSchema,
	dietaryRestrictions: dietaryRestrictionsSchema,
	wantsFood: wantsFoodSchema
});

export type SignupEventDetails = z.output<typeof signupEventDetailsSchema>;
export type SignupEventDetailsInput = z.input<typeof signupEventDetailsSchema>;
