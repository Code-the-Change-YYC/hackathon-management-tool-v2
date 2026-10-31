import { getAssetUrl, getFields, getString } from "@/lib/contentful";
import type { Resource } from "@/types/contentfulTypes";

function compareResources(left: Resource, right: Resource): number {
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

	return (getString(leftFields.description) ?? "").localeCompare(
		getString(rightFields.description) ?? ""
	);
}

function isRenderableResource(entry: Resource): boolean {
	const fields = getFields(entry);

	return Boolean(
		getString(fields.name)?.trim() &&
			getString(fields.description)?.trim() &&
			getString(fields.link)?.trim() &&
			getAssetUrl(fields.image)
	);
}

export function mapResources(entries: readonly Resource[]): Resource[] {
	return entries.filter(isRenderableResource).sort(compareResources);
}
