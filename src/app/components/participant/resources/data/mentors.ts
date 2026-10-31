import { getFields, getString } from "@/lib/contentful";
import {
	MENTOR_CATEGORIES,
	type Mentor,
	type MentorCategory
} from "@/types/contentfulTypes";

function compareMentors(left: Mentor, right: Mentor): number {
	const leftFields = getFields(left);
	const rightFields = getFields(right);

	const [nameLeft, nameRight] = [
		getString(leftFields.name)?.trim() ?? "",
		getString(rightFields.name)?.trim() ?? ""
	];
	const nameComparison = nameLeft.localeCompare(nameRight);
	if (nameComparison !== 0) {
		return nameComparison;
	}

	return (getString(leftFields.role) ?? "").localeCompare(
		getString(rightFields.role) ?? ""
	);
}

function isMentorCategory(value: unknown): value is MentorCategory {
	return (MENTOR_CATEGORIES as readonly unknown[]).includes(value);
}

function isRenderableMentor(entry: Mentor): boolean {
	const fields = getFields(entry);

	return Boolean(
		getString(fields.name)?.trim() &&
			getString(fields.role)?.trim() &&
			isMentorCategory(getString(fields.category))
	);
}

export function processMentors(
	entries: readonly Mentor[]
): Map<MentorCategory, Mentor[]> {
	return entries
		.filter(isRenderableMentor)
		.sort(compareMentors)
		.reduce((map, entry) => {
			const fields = getFields(entry);
			const category = getString(fields.category) as MentorCategory;

			const group = map.get(category) ?? [];
			group.push(entry);

			map.set(category, group);

			return map;
		}, new Map<MentorCategory, Mentor[]>());
}
