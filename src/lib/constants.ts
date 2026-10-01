import { Role } from "@/types/types";

export const DASHBOARD_HREFS: Record<Role, string> = {
	[Role.ADMIN]: "/admin",
	[Role.JUDGE]: "/judge",
	[Role.PARTICIPANT]: "/participant"
};

export const DISCORD_URL = "https://discord.gg/bhJnwXjJYP";
export const DEVPOST_URL = "https://hack-the-change-2026.devpost.com/";

// The MLH policies participants agree to during onboarding.
export const MLH_CODE_OF_CONDUCT_URL =
	"https://github.com/MLH/mlh-policies/blob/main/code-of-conduct.md";
export const MLH_CONTEST_TERMS_URL =
	"https://github.com/MLH/mlh-policies/blob/main/contest-terms.md";
export const MLH_PRIVACY_POLICY_URL =
	"https://github.com/MLH/mlh-policies/blob/main/privacy-policy.md";
export const DEV_URL = "https://dev.to";
