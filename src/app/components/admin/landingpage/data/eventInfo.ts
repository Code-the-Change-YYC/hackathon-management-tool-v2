import type { EventInfoItem } from "@/types/landingPage";

export const eventInfoItems: EventInfoItem[] = [
	{ id: "date", icon: "/svgs/landingPage/date_icon.svg", label: "Date" },
	{
		id: "location",
		icon: "/svgs/landingPage/location_icon.svg",
		label: "Location"
	},
	{ id: "public", icon: "/svgs/landingPage/public_icon.svg", label: "Public" },
	{
		id: "prizes",
		icon: "/svgs/landingPage/prize_icon.svg",
		label: "$XXXX Prizes"
	}
];
