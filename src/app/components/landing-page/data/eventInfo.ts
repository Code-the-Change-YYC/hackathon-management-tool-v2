import {
	Calendar2Line,
	GiftLine,
	HeartLine,
	LocationLine
} from "@mingcute/react";
import type { EventInfoItem } from "@/types/landingPage";

export const eventInfoItems: EventInfoItem[] = [
	{
		id: "date",
		icon: Calendar2Line,
		label: "Nov 7 - Nov 8, 2026"
	},
	{
		id: "location",
		icon: LocationLine,
		label: "University of Calgary - ENG 207"
	},
	{ id: "public", icon: HeartLine, label: "Public" },
	{
		id: "prizes",
		icon: GiftLine,
		label: "$10,000 in Prizes"
	}
];
