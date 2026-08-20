export const enabledSocialProviders = [
	{
		id: "google",
		label: "Google"
	}
] as const;

export type SocialProviderId = (typeof enabledSocialProviders)[number]["id"];
