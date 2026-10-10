import "server-only";
import mlhSchools from "@/lib/data/mlh-schools.json";

const MLH_SCHOOLS = new Set(mlhSchools);

/** Whether a saved school came from MLH's list rather than being typed in. */
export function isMlhSchool(school: string | null | undefined) {
	return school != null && MLH_SCHOOLS.has(school);
}
