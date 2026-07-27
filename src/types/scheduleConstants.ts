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
