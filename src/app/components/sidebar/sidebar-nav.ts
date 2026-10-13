import {
	Calendar2Fill,
	Calendar2Line,
	CodeFill,
	CodeLine,
	DiscordFill,
	DiscordLine,
	Group2Fill,
	Group2Line,
	HamburgerFill,
	HamburgerLine,
	Home4Fill,
	Home4Line,
	LinkFill,
	LinkLine,
	QuestionFill,
	QuestionLine,
	Settings3Fill,
	Settings3Line,
	TaskFill,
	TaskLine,
	User3Fill,
	User3Line
} from "@mingcute/react";

export const NAV_ICONS = {
	home: { line: Home4Line, fill: Home4Fill },
	calendar: { line: Calendar2Line, fill: Calendar2Fill },
	group: { line: Group2Line, fill: Group2Fill },
	hamburger: { line: HamburgerLine, fill: HamburgerFill },
	link: { line: LinkLine, fill: LinkFill },
	task: { line: TaskLine, fill: TaskFill },
	question: { line: QuestionLine, fill: QuestionFill },
	discord: { line: DiscordLine, fill: DiscordFill },
	user: { line: User3Line, fill: User3Fill },
	settings: { line: Settings3Line, fill: Settings3Fill },
	code: { line: CodeLine, fill: CodeFill }
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
