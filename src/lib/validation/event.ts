import { z } from "zod";
import { fromDateTimeLocalValue } from "@/lib/datetime";
import { eventNavigationUrlSchema } from "@/lib/participant-events";
import { EVENT_TYPES, EventStatus, EventType } from "@/types/types";

export const EVENT_TITLE_MAX_LENGTH = 120;
export const EVENT_DESCRIPTION_MAX_LENGTH = 1000;
export const EVENT_LOCATION_MAX_LENGTH = 200;

export const EVENT_TYPE_OPTIONS = EVENT_TYPES.map((value) => ({
	value,
	label: value.charAt(0).toUpperCase() + value.slice(1)
}));

const dateTimeField = z.string().transform((value, ctx) => {
	const date = fromDateTimeLocalValue(value);
	if (!date) {
		ctx.addIssue({ code: "custom", message: "Choose a date and time." });
		return z.NEVER;
	}
	return date;
});

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
		startTime: dateTimeField,
		endTime: dateTimeField
	})
	.refine((data) => data.endTime > data.startTime, {
		message: "End time must be after start time.",
		path: ["endTime"]
	})
	.transform(({ published, ...data }) => ({
		...data,
		status: published ? EventStatus.ACTIVE : EventStatus.DRAFT
	}));

export type EventFormInput = z.input<typeof eventFormSchema>;
export type EventFormValues = z.output<typeof eventFormSchema>;

export const EMPTY_EVENT_FORM: EventFormInput = {
	title: "",
	description: "",
	type: EventType.ACTIVITY,
	published: true,
	location: "",
	navigationUrl: "",
	startTime: "",
	endTime: ""
};
