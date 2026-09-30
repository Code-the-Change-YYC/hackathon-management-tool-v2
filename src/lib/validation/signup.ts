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
	"High school",
	"Other",
	"Not attending school"
] as const;

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

const WANTS_FOOD_REQUIRED = "Let us know if you'd like free meals";

export const foodPreferencesSchema = z.object({
	wantsFood: z.boolean({
		invalid_type_error: WANTS_FOOD_REQUIRED,
		required_error: WANTS_FOOD_REQUIRED
	}),
	dietaryRestrictions: dietaryRestrictionsSchema
});

export type FoodPreferences = z.infer<typeof foodPreferencesSchema>;
