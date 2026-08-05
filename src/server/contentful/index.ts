import * as contentful from "contentful";
import "server-only";
import type { BaseEntry } from "contentful";
import type { ContentTypeMap } from "@/types/contentfulTypes";

const contentfulClient = contentful.createClient({
	space: process.env.CONTENTFUL_SPACE_ID ?? "",
	accessToken: process.env.CONTENTFUL_ACCESS_TOKEN ?? ""
});
interface ContentfulEntry<T> extends BaseEntry {
	contentTypeId: string;
	fields: T;
}

export async function fetchContentful<T extends keyof ContentTypeMap>(
	contentId: T
): Promise<ContentfulEntry<ContentTypeMap[T]>[]> {
	const res = await contentfulClient.getEntries<
		ContentfulEntry<ContentTypeMap[T]>
	>({
		content_type: contentId
	});
	const data = res.items;
	return data as ContentfulEntry<ContentTypeMap[T]>[];
}
