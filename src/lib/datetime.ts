import { tz } from "@date-fns/tz";
import { format, isSameDay, isValid, parse } from "date-fns";

// The hackathon is in person in Calgary, so every time is Calgary time no
// matter where the code runs (servers are usually UTC) or who is viewing.
//
// Alberta stopped changing its clocks in 2026: Calgary moved to UTC-6 on
// March 8 and stays there (tzdata 2026c). Browsers and servers with older
// time-zone data still move "America/Edmonton" back to UTC-7 on November 1,
// which would show and save every hackathon time an hour off, so this is a
// fixed offset. Dates before March 8, 2026, when Calgary was on UTC-7, come
// out an hour late.
//
// https://www.alberta.ca/albertas-new-time-system-abt
export const CALGARY_TIME_ZONE = "-06:00";
const calgary = tz(CALGARY_TIME_ZONE);

type DateValue = Date | string | number;

const DATE_INPUT_FORMAT = "yyyy-MM-dd";
const TIME_INPUT_FORMAT = "HH:mm";
const DATE_TIME_INPUT_FORMAT = `${DATE_INPUT_FORMAT}'T'${TIME_INPUT_FORMAT}`;

export function formatTime(value: DateValue) {
	return format(value, "h:mm a", { in: calgary });
}

export function formatLongDate(value: DateValue) {
	return format(value, "EEEE, MMMM d", { in: calgary });
}

export function formatFullDate(value: DateValue) {
	return format(value, "MMMM d, yyyy", { in: calgary });
}

export function formatDateTime(value: DateValue) {
	return format(value, "MMM d, yyyy, h:mm a", { in: calgary });
}

export function formatDateKey(value: DateValue) {
	return format(value, DATE_INPUT_FORMAT, { in: calgary });
}

export function isSameCalgaryDay(left: DateValue, right: DateValue) {
	return isSameDay(left, right, { in: calgary });
}

export function toDateTimeLocalValue(value?: Date | null) {
	return value && isValid(value)
		? format(value, DATE_TIME_INPUT_FORMAT, { in: calgary })
		: "";
}

export function fromDateTimeLocalValue(value: string) {
	const date = parse(value, DATE_TIME_INPUT_FORMAT, new Date(), {
		in: calgary
	});
	return isValid(date) ? new Date(date.getTime()) : null;
}

export function toTimeInputValue(value?: Date | null) {
	return value && isValid(value)
		? format(value, TIME_INPUT_FORMAT, { in: calgary })
		: "";
}

export function toDateInputValue(value?: Date | null) {
	return value && isValid(value) ? formatDateKey(value) : "";
}

// Moves `existing` to the given day, keeping its time of day (midnight if unset).
export function fromDateInputValue(value: string, existing?: Date | null) {
	const time =
		existing && isValid(existing)
			? format(existing, TIME_INPUT_FORMAT, { in: calgary })
			: "00:00";
	return fromDateTimeLocalValue(`${value}T${time}`);
}
