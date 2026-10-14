import { tz } from "@date-fns/tz";
import { format, isValid } from "date-fns";

export function formatTime(value: Date | string | number, timeZone?: string) {
	return format(value, "h:mm a", { in: timeZone ? tz(timeZone) : undefined });
}

export function formatLongDate(
	value: Date | string | number,
	timeZone?: string
) {
	return format(value, "EEEE, MMMM d", {
		in: timeZone ? tz(timeZone) : undefined
	});
}

export function formatDateTime(value: Date | string | number) {
	return format(value, "MMM d, yyyy, h:mm a");
}

export function toDateTimeLocalValue(value?: Date | null) {
	return value && isValid(value) ? format(value, "yyyy-MM-dd'T'HH:mm") : "";
}
