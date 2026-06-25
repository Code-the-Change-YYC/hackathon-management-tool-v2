export type Judge = {
	id: string;
	name: string;
	company: string;
	image: string;
};

export type EventInfoItem = {
	id: string;
	icon: string;
	label: string;
};

export type Criterion = {
	id: string;
	text: string;
};

export type Sponsor = {
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
	isSignedIn: boolean;
	hasTeam: boolean;
};

export type CriteriaItemProps = {
	text: string;
};

export type EventDetailProps = {
	icon: string;
	label: string;
};

export type JudgeItemProps = {
	name: string;
	company: string;
	image: string;
};
