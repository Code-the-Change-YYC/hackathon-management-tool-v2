import { getFields, getString } from "@/lib/contentful";
import { MENTOR_CATEGORIES, type Mentor } from "@/types/contentfulTypes";

function getCategoryOrder(entry: Mentor): number {
	const index = (MENTOR_CATEGORIES as readonly unknown[]).indexOf(
		getString(getFields(entry).category)
	);
	return index === -1 ? MENTOR_CATEGORIES.length : index;
}

function compareMentors(left: Mentor, right: Mentor): number {
	const categoryComparison = getCategoryOrder(left) - getCategoryOrder(right);
	if (categoryComparison !== 0) {
		return categoryComparison;
	}

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

function isRenderableMentor(entry: Mentor): boolean {
	const fields = getFields(entry);

	return Boolean(
		getString(fields.name)?.trim() && getString(fields.role)?.trim()
	);
}

export function processMentors(entries: readonly Mentor[]): Mentor[] {
	return entries.filter(isRenderableMentor).sort(compareMentors);
}
