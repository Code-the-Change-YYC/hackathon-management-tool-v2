import {
	Calendar2Line,
	DiscordLine,
	GroupLine,
	HamburgerLine,
	Home4Line,
	LinkLine,
	QuestionLine,
	Settings3Line,
	TaskLine,
	User3Line
} from "@mingcute/react";

export const NAV_ICONS = {
	home: Home4Line,
	calendar: Calendar2Line,
	group: GroupLine,
	hamburger: HamburgerLine,
	link: LinkLine,
	task: TaskLine,
	question: QuestionLine,
	discord: DiscordLine,
	user: User3Line,
	settings: Settings3Line
} as const;

export type NavIconKey = keyof typeof NAV_ICONS;

export interface NavItem {
	title: string;
	href: string;
	icon: NavIconKey;
	external?: boolean;
}

export interface NavGroup {
	groupLabel: string;
	items: NavItem[];
}
