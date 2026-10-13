import { addDays, setHours, startOfHour } from "date-fns";

export function getEventDate(dayOffset: number, hour: number) {
	return addDays(startOfHour(setHours(new Date(), hour)), dayOffset);
}
