import { z } from "zod";
import { fromDateTimeLocalValue } from "@/lib/datetime";
import { eventNavigationUrlSchema } from "@/lib/participant-events";
import { EVENT_TYPES, EventStatus, EventType } from "@/types/types";

export const EVENT_TITLE_MAX_LENGTH = 120;
export const EVENT_DESCRIPTION_MAX_LENGTH = 1000;
export const EVENT_LOCATION_MAX_LENGTH = 200;

const timeField = (message: string) =>
	z.string().regex(/^\d{2}:\d{2}$/, message);

const optionalText = z
	.string()
	.trim()
	.transform((value) => value || null);

export const eventFormSchema = z
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
		date: z
			.string()
			.refine((value) => fromDateTimeLocalValue(`${value}T00:00`) !== null, {
				message: "Choose a date."
			}),
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
	});

export type EventFormInput = z.input<typeof eventFormSchema>;
export type EventFormValues = z.output<typeof eventFormSchema>;

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
