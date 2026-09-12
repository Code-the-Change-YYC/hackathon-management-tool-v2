export function getEventDate(dayOffset: number, hour: number) {
	const date = new Date();
	date.setHours(hour, 0, 0, 0);
	date.setDate(date.getDate() + dayOffset);
	return date;
}
