import { GoogleLine } from "@mingcute/react";

export const ENABLED_SOCIAL_PROVIDERS = [
	{
		id: "google",
		label: "Google",
		icon: GoogleLine
	}
] as const;

export type SocialProviderId = (typeof ENABLED_SOCIAL_PROVIDERS)[number]["id"];
