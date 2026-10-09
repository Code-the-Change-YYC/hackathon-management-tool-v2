import { z } from "zod";

export const PROGRAMS = [
	"computer_science",
	"software_engineering",
	"electrical_engineering",
	"other"
] as const;

export const LEVELS_OF_STUDY = [
	"less_than_secondary",
	"secondary",
	"undergraduate_two_year",
	"undergraduate_three_plus_year",
	"graduate",
	"code_school",
	"vocational",
	"post_doctorate",
	"other",
	"not_a_student",
	"prefer_not_to_answer"
] as const;

export type LevelOfStudy = (typeof LEVELS_OF_STUDY)[number];

// MLH's wording, which member events are required to use.
export const LEVEL_OF_STUDY_LABELS = {
	less_than_secondary: "Less than Secondary / High School",
	secondary: "Secondary / High School",
	undergraduate_two_year:
		"Undergraduate University (2 year - community college or similar)",
	undergraduate_three_plus_year: "Undergraduate University (3+ year)",
	graduate: "Graduate University (Masters, Professional, Doctoral, etc)",
	code_school: "Code School / Bootcamp",
	vocational: "Other Vocational / Trade Program or Apprenticeship",
	post_doctorate: "Post Doctorate",
	other: "Other",
	not_a_student: "I’m not currently a student",
	prefer_not_to_answer: "Prefer not to answer"
} satisfies Record<LevelOfStudy, string>;

export const DIETARY_RESTRICTIONS = [
	"halal",
	"vegetarian",
	"vegan",
	"gluten_free",
	"dairy_free",
	"nut_allergy",
	"other"
] as const;

export type DietaryRestriction = (typeof DIETARY_RESTRICTIONS)[number];

export const DIETARY_RESTRICTION_LABELS = {
	halal: "Halal",
	vegetarian: "Vegetarian",
	vegan: "Vegan",
	gluten_free: "Gluten-free",
	dairy_free: "Dairy-free",
	nut_allergy: "Nut allergy",
	other: "Other"
} satisfies Record<DietaryRestriction, string>;

/** Keeps the known restrictions from a stored list, in display order. */
export function toDietaryRestrictions(
	values: readonly string[]
): DietaryRestriction[] {
	return DIETARY_RESTRICTIONS.filter((restriction) =>
		values.includes(restriction)
	);
}

export const dietaryRestrictionsSchema = z
	.array(z.enum(DIETARY_RESTRICTIONS))
	.max(DIETARY_RESTRICTIONS.length)
	.refine(
		(restrictions) => new Set(restrictions).size === restrictions.length,
		{ message: "Duplicate dietary restrictions are not allowed" }
	);

export const foodPreferencesSchema = z.object({
	wantsFood: z.boolean(),
	dietaryRestrictions: dietaryRestrictionsSchema
});

export type FoodPreferences = z.infer<typeof foodPreferencesSchema>;
