import type { IconProps } from "@mingcute/react";
import type { ElementType } from "react";
import type { PastHackathonWinner } from "./contentfulTypes";

export type MingCuteIcon = ElementType<IconProps>;

export type Judge = {
	id: string;
	name: string;
	company: string;
	image: string;
};

export type EventInfoItem = {
	id: string;
	icon: MingCuteIcon;
	label: string;
};

export type Criterion = {
	category: string;
	description: string;
};

export type Sponsor = {
	url: string | undefined;
	id: string;
	image: string;
	name: string;
};

export type TimeLeft = {
	days: number;
	hours: number;
	minutes: number;
	seconds: number;
};

export type InfoSectionProps = {
	title?: string;
	titleColor?: string;
	titleHighlight?: string;
	bodyTextColor?: string;
	paragraphs: string[];
	imageSrc: string;
	imageAlt: string;
	bgColor: string;
	accentSrc?: string;
	accentPosition?: "before" | "after";
	reverse?: boolean;
};

export type HeaderProps = {
	hasTeam: boolean;
};

export type CriteriaItemProps = {
	category: string;
	text: string;
};

export type EventDetailProps = {
	icon: MingCuteIcon;
	label: string;
};

export type JudgeItemProps = {
	name: string;
	company: string;
	image: string;
};

export type WinnerCardProps = {
	winner: PastHackathonWinner;
	index: number;
	total: number;
};
