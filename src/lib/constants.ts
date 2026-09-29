import { Role } from "@/types/types";

export const DASHBOARD_HREFS: Record<Role, string> = {
	[Role.ADMIN]: "/admin",
	[Role.JUDGE]: "/judge",
	[Role.PARTICIPANT]: "/participant"
};

export const DISCORD_URL = "https://discord.gg/bhJnwXjJYP";
export const DEVPOST_URL = "https://hack-the-change-2026.devpost.com/";

// TODO: Switch these back to "/signup" and "/login" once registration opens.
// The landing page links to a placeholder page until then.
export const SIGNUP_HREF = "/under-construction";
export const LOGIN_HREF = "/under-construction";
