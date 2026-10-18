import type { IconProps } from "@mingcute/react";
import type { ElementType } from "react";

export type MingCuteIcon = ElementType<IconProps>;

export type EventInfoItem = {
	id: string;
	icon: MingCuteIcon;
	label: string;
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
