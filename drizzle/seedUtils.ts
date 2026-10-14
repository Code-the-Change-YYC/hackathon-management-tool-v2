import { TZDate } from "@date-fns/tz";
import { addDays, setHours, startOfHour } from "date-fns";
import { CALGARY_TIME_ZONE } from "@/lib/datetime";

// Hours are Calgary wall-clock times.
export function getEventDate(dayOffset: number, hour: number) {
	const today = new TZDate(Date.now(), CALGARY_TIME_ZONE);
	const date = addDays(startOfHour(setHours(today, hour)), dayOffset);
	return new Date(date.getTime());
}
