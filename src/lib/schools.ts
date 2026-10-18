/**
 * The school question uses MLH's list of verified schools, as MLH member
 * events must. The list is large, so it's loaded on demand; the local schools
 * most participants attend are pinned to the top.
 */

export const UNIVERSITY_OF_CALGARY = "University of Calgary";

export const PINNED_SCHOOLS = [
	UNIVERSITY_OF_CALGARY,
	"Mount Royal University",
	"Southern Alberta Institute of Technology"
];

/** The school picker's choice for a school that isn't on MLH's list. */
export const SCHOOL_NOT_LISTED = "not-listed";

export const SCHOOL_NAME_MAX_LENGTH = 150;

/** Every school on MLH's list, with the pinned schools first. */
export async function loadSchools() {
	const { default: mlhSchools } = await import("@/lib/data/mlh-schools.json");
	const pinned = new Set(PINNED_SCHOOLS);

	return [
		...PINNED_SCHOOLS,
		...mlhSchools.filter((school) => !pinned.has(school))
	];
}
