import type { Entry } from "contentful";

export function getFields<T extends Entry>(entry: T): T["fields"] {
	return entry.fields;
}

export function getString(value: unknown): string | undefined {
	return typeof value === "string" ? value : undefined;
}

export function getNumber(value: unknown): number | undefined {
	return typeof value === "number" ? value : undefined;
}

export function getAssetUrl(asset: unknown): string | undefined {
	if (!asset || typeof asset !== "object" || !("fields" in asset)) {
		return undefined;
	}

	const fields = asset.fields;
	if (!fields || typeof fields !== "object" || !("file" in fields)) {
		return undefined;
	}

	const file = fields.file;
	if (!file || typeof file !== "object" || !("url" in file)) {
		return undefined;
	}

	const url = getString(file.url);
	if (!url) {
		return undefined;
	}

	return url.startsWith("//") ? `https:${url}` : url;
}
