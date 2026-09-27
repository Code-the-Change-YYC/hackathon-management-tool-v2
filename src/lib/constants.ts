import { Role } from "@/types/types";

export const DISCORD_URL = "https://discord.gg/codethechangeyyc";

export const DASHBOARD_HREFS: Record<Role, string> = {
	[Role.ADMIN]: "/admin",
	[Role.JUDGE]: "/judge",
	[Role.PARTICIPANT]: "/participant"
};

// TODO: Switch these back to "/signup" and "/login" once registration opens.
// The landing page links to a placeholder page until then.
export const SIGNUP_HREF = "/under-construction";
export const LOGIN_HREF = "/under-construction";
