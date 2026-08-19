"use client";

import { GoogleLine } from "@mingcute/react";

export const enabledSocialProviders = [
	{
		id: "google",
		label: "Google",
		icon: GoogleLine
	}
] as const;

export type SocialProviderId = (typeof enabledSocialProviders)[number]["id"];
