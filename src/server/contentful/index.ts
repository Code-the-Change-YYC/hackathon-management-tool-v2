import * as contentful from "contentful";
import "server-only";
import type { Entry } from "contentful";
import { env } from "@/env";
import type { ContentTypeMap } from "@/types/contentfulTypes";

const contentfulClient = contentful.createClient({
	space: env.CONTENTFUL_SPACE_ID,
	accessToken: env.CONTENTFUL_ACCESS_TOKEN
});

export type ContentfulEntry<T extends keyof ContentTypeMap> = Entry<
	ContentTypeMap[T]
>;

export async function fetchContentful<T extends keyof ContentTypeMap>(
	contentId: T
): Promise<ContentfulEntry<T>[]> {
	const res = await contentfulClient.getEntries<ContentTypeMap[T]>({
		content_type: contentId
	});
	return res.items;
}
