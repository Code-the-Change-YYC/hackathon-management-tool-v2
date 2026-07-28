import type { Event } from "./types";

// Hardcoded first day information
export const START_DAY = {
	year: 2026,
	month: 7,
	day: 21
};

// Calculated constants
// Mountaim Time offset for easy hardcoding of dates
export const MT_OFFSET_MINS = getTimezoneOffset("Canada/Mountain", START_DAY);
// 00:00 on first day
export const FIRST_DATE = createDate("first", 0, 0);
// 00:00 on second day
export const SECOND_DATE = createDate("second", 0, 0);

export const FIRST_DAY_EVENTS: Event[] = [
	{
		name: "Breakfast",
		description:
			"Start your day off right with pastries and coffee. Don't forget your food ticket!",
		category: "food",
		location: "ENA 224",
		startTime: createDate("first", 10, 0),
		endTime: createDate("first", 9, 0)
	},
	{
		name: "Opening Ceremony",
		description:
			"Get ready to hack! Hear from our sponsors and organizers before getting started.",
		category: "ceremony",
		location: "Auditorium A",
		startTime: createDate("first", 10, 30),
		endTime: createDate("first", 11, 30)
	},
	{
		name: "Hacking Begins",
		description:
			"Time to get hacking! Work with your team to make your project a reality.",
		category: "project",
		location: "All Rooms",
		endTime: createDate("first", 20, 0),
		startTime: createDate("first", 11, 30)
	},
	{
		name: "Lunch",
		description:
			"Take a break and refuel with a tasty lunch. Vegetarian options will be available.",
		category: "food",
		location: "Dining Hall",
		endTime: createDate("first", 14, 0),
		startTime: createDate("first", 13, 0)
	},
	{
		name: "CS Trivia",
		description:
			"Show off your CS knowledge and win prizes. It's a great way to unwind from coding!",
		category: "activity",
		location: "Room 303",
		endTime: createDate("first", 15, 0),
		startTime: createDate("first", 14, 0)
	},
	{
		name: "Finders Key-pers Scavenger Hunt",
		description:
			"Explore the campus and solve puzzles to find hidden keys. Work together to win!",
		category: "activity",
		location: "Campus Wide",
		endTime: createDate("first", 16, 0),
		startTime: createDate("first", 15, 0)
	},
	{
		name: "Ice Cream Break",
		description:
			"Enjoy a refreshing ice cream. The perfect way to recharge in the afternoon!",
		category: "food",
		location: "Quad Area",
		endTime: createDate("first", 16, 30),
		startTime: createDate("first", 16, 0)
	},
	{
		name: "Dinner",
		description:
			"Time for dinner! Refuel for the final ahcking session. Lots of options will be available.",
		category: "food",
		location: "Dining Hall",
		endTime: createDate("first", 20, 0),
		startTime: createDate("first", 19, 0)
	}
];

export const SECOND_DAY_EVENTS: Event[] = [
	{
		name: "Dining Hall",
		description:
			"Power through the last few hours of hacking with a nutricious breakfast.",
		category: "food",
		location: "ENA 224",
		endTime: createDate("second", 8, 0),
		startTime: createDate("second", 9, 0)
	},
	{
		name: "Submissions Close",
		description:
			"The dealdine is approaching! Submit your project iwht all required documents.",
		category: "project",
		location: "Online",
		endTime: createDate("second", 10, 30),
		startTime: createDate("second", 10, 0)
	},
	{
		name: "Judging Begins!",
		description:
			"Our expert judges will evaluate projects based on innovation, impact, and execution.",
		category: "project",
		location: "Judges Lounge",
		endTime: createDate("second", 12, 0),
		startTime: createDate("second", 10, 30)
	},
	{
		name: "Closing Ceremony",
		description:
			"Celebrate the achievements of all the hackers and find out who won. Don't miss it!",
		category: "activity",
		location: "Auditorium A",
		endTime: createDate("second", 1, 0),
		startTime: createDate("second", 12, 0)
	}
];

/*
 * Helper functions to help with creation and formatting of dates
 */
// Create a date based on the first day, with offset added so hard-coded times are in MT
export function createDate(
	day: "first" | "second",
	hours: number,
	minutes: number
) {
	return new Date(
		Date.UTC(
			START_DAY.year,
			START_DAY.month - 1,
			START_DAY.day + (day === "first" ? 0 : 1),
			hours,
			minutes + MT_OFFSET_MINS
		)
	);
}

// Get day number with appropriate suffix
export function getOrdinalDay(date: Date) {
	const day = date.getDate();

	// Exception for teen days
	if (day > 10 && day < 20) return `${day}th`;

	// Assign st, nd, rd based on the final digit
	switch (day % 10) {
		case 1:
			return `${day}st`;
		case 2:
			return `${day}nd`;
		case 3:
			return `${day}rd`;
		default:
			return `${day}th`;
	}
}

// Get formatted day string
export function getDayString(date: Date) {
	const weekday = date.toLocaleDateString("en-US", {
		weekday: "long"
	});
	const month = date.toLocaleDateString("en-US", {
		month: "long"
	});
	const ordinalDay = getOrdinalDay(date);

	return `${weekday}, ${month} ${ordinalDay}`;
}

// Compare dates
export function sameDay(date1: Date, date2: Date) {
	return (
		date1.getFullYear() === date2.getFullYear() &&
		date1.getMonth() === date2.getMonth() &&
		date1.getDate() === date2.getDate()
	);
}

export function getTimezoneOffset(
	timeZone: string,
	{ year, month, day }: { year: number; month: number; day: number }
): number {
	// Format the first date into the target timezone components
	const tzString = new Date(year, month, day).toLocaleString("en-US", {
		timeZone
	});
	const localDate = new Date(tzString);

	// Format the first date into UTC components
	const utcString = new Date(year, month, day).toLocaleString("en-US", {
		timeZone: "UTC"
	});
	const utcDate = new Date(utcString);

	// Calculate difference in minutes
	return (utcDate.getTime() - localDate.getTime()) / 60000;
}
