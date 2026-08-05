import "server-only";
import * as contentful from "contentful";

export const contentfulClient = contentful.createClient({
	space: process.env.CONTENTFUL_SPACE_ID ?? "",
	accessToken: process.env.CONTENTFUL_ACCESS_TOKEN ?? ""
});
