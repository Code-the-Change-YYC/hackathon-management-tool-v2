export type EventInfoItem = {
	id: string;
	icon: string;
	label: string;
};

export const eventInfoItems: EventInfoItem[] = [
	{ id: "date", icon: "/svgs/calendar.svg", label: "Date" },
	{ id: "location", icon: "/svgs/location.svg", label: "Location" },
	{ id: "public", icon: "/svgs/heart.svg", label: "Public" },
	{ id: "prizes", icon: "/svgs/diamond.svg", label: "$XXXX Prizes" }
];
