import { z } from "zod";
import {
	formatFullDate,
	fromDateTimeLocalValue,
	toDateInputValue
} from "@/lib/datetime";
import { eventNavigationUrlSchema } from "@/lib/participant-events";
import { EVENT_TYPES, EventStatus, EventType } from "@/types/types";

export const EVENT_TITLE_MAX_LENGTH = 120;
export const EVENT_DESCRIPTION_MAX_LENGTH = 1000;
export const EVENT_LOCATION_MAX_LENGTH = 200;

export const timeField = (message: string) =>
	z.string().regex(/^\d{2}:\d{2}$/, message);

// The hackathon's first and last days, as "yyyy-MM-dd" in Calgary time.
export type HackathonDates = { start: string; end: string };

export function toHackathonDates(
	settings: { startDate: Date | null; endDate: Date | null } | null
): HackathonDates | null {
	if (!settings?.startDate || !settings.endDate) return null;
	return {
		start: toDateInputValue(settings.startDate),
		end: toDateInputValue(settings.endDate)
	};
}

// Date keys sort the same as the days they name.
export function isDuringHackathon(
	date: string,
	{ start, end }: HackathonDates
) {
	return date >= start && date <= end;
}

export function outsideHackathonMessage({ start, end }: HackathonDates) {
	const first = parseDate(start);
	const last = parseDate(end);
	const range =
		first && last
			? `${formatFullDate(first)} to ${formatFullDate(last)}`
			: `${start} to ${end}`;
	return `Choose a date during the hackathon, ${range}.`;
}

function parseDate(value: string) {
	return fromDateTimeLocalValue(`${value}T00:00`);
}

export function dateField(hackathonDates: HackathonDates | null) {
	const date = z
		.string()
		.refine((value) => parseDate(value) !== null, "Choose a date.");
	if (!hackathonDates) return date;

	return date.refine(
		(value) => !parseDate(value) || isDuringHackathon(value, hackathonDates),
		outsideHackathonMessage(hackathonDates)
	);
}

const optionalText = z
	.string()
	.trim()
	.transform((value) => value || null);

export function createEventFormSchema(hackathonDates: HackathonDates | null) {
	return (
		z
			.object({
				title: z
					.string()
					.trim()
					.min(1, "Enter a title.")
					.max(EVENT_TITLE_MAX_LENGTH),
				description: z
					.string()
					.trim()
					.min(1, "Enter a description.")
					.max(EVENT_DESCRIPTION_MAX_LENGTH),
				type: z.enum(EVENT_TYPES, { message: "Choose a type." }),
				published: z.boolean(),
				location: optionalText.pipe(
					z.string().max(EVENT_LOCATION_MAX_LENGTH).nullable()
				),
				navigationUrl: optionalText.pipe(eventNavigationUrlSchema.nullable()),
				date: dateField(hackathonDates),
				startTime: timeField("Choose a start time."),
				endTime: timeField("Choose an end time.")
			})
			.refine((data) => data.endTime > data.startTime, {
				message: "End time must be after start time.",
				path: ["endTime"]
			})
			// Both times fall on the one date, in Calgary time.
			.transform(({ published, date, startTime, endTime, ...data }, ctx) => {
				const start = fromDateTimeLocalValue(`${date}T${startTime}`);
				const end = fromDateTimeLocalValue(`${date}T${endTime}`);
				if (!start || !end) {
					ctx.addIssue({
						code: "custom",
						message: "Choose a date.",
						path: ["date"]
					});
					return z.NEVER;
				}
				return {
					...data,
					startTime: start,
					endTime: end,
					status: published ? EventStatus.ACTIVE : EventStatus.DRAFT
				};
			})
	);
}

type EventFormSchema = ReturnType<typeof createEventFormSchema>;
export type EventFormInput = z.input<EventFormSchema>;
export type EventFormValues = z.output<EventFormSchema>;

export const EMPTY_EVENT_FORM: EventFormInput = {
	title: "",
	description: "",
	type: EventType.ACTIVITY,
	published: true,
	location: "",
	navigationUrl: "",
	date: "",
	startTime: "",
	endTime: ""
};
