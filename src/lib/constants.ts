import { Role } from "@/types/types";

export const DISCORD_URL = "https://discord.gg/codethechangeyyc";

export const DASHBOARD_HREFS: Record<Role, string> = {
	[Role.ADMIN]: "/admin",
	[Role.JUDGE]: "/judge",
	[Role.PARTICIPANT]: "/participant"
};
