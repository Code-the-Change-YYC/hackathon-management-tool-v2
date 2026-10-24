import { z } from "zod";
import {
	formatDateKey,
	fromDateTimeLocalValue,
	toDateInputValue,
	toTimeInputValue
} from "@/lib/datetime";

export type HackathonDateSettings = {
	startDate: Date | null;
	endDate: Date | null;
	submissionDeadline: Date | null;
};

type HackathonDateValues = {
	startDate: Date;
	endDate: Date;
	submissionDeadline: Date | null;
};

type OrderIssue = {
	path: "endDate" | "submissionDeadline";
	message: string;
};

function orderIssues({
	startDate,
	endDate,
	submissionDeadline
}: HackathonDateValues): OrderIssue[] {
	const issues: OrderIssue[] = [];
	if (endDate <= startDate) {
		issues.push({
			path: "endDate",
			message: "The end must be after the start."
		});
	}
	if (submissionDeadline && submissionDeadline <= startDate) {
		issues.push({
			path: "submissionDeadline",
			message: "The deadline must be after the start."
		});
	} else if (submissionDeadline && submissionDeadline > endDate) {
		issues.push({
			path: "submissionDeadline",
			message: "The deadline can’t be after the end."
		});
	}
	return issues;
}

// Events are kept within the hackathon by Calgary day, so an event on the
// first day can still start before the kickoff time.
export function countEventsOutside(
	eventStarts: Date[],
	{ startDate, endDate }: Pick<HackathonDateValues, "startDate" | "endDate">
) {
	const first = formatDateKey(startDate);
	const last = formatDateKey(endDate);
	const days = eventStarts.map(formatDateKey);
	return {
		before: days.filter((day) => day < first).length,
		after: days.filter((day) => day > last).length
	};
}

function eventsAre(count: number) {
	return count === 1 ? "1 event is" : `${count} events are`;
}

function moveOrDelete(count: number) {
	return `Move or delete ${count === 1 ? "it" : "them"} first.`;
}

export function eventsOutsideMessage(count: number) {
	return `${eventsAre(count)} scheduled outside these dates. ${moveOrDelete(count)}`;
}

export const hackathonDatesSchema = z
	.object({
		startDate: z.date(),
		endDate: z.date(),
		submissionDeadline: z.date().nullable()
	})
	.superRefine((values, ctx) => {
		for (const { path, message } of orderIssues(values)) {
			ctx.addIssue({ code: "custom", message, path: [path] });
		}
	});

const requiredText = (message: string) => z.string().min(1, message);

export function createHackathonDatesFormSchema(eventStarts: Date[]) {
	return z
		.object({
			startDate: requiredText("Choose a date."),
			startTime: requiredText("Choose a time."),
			endDate: requiredText("Choose a date."),
			endTime: requiredText("Choose a time."),
			deadlineDate: z.string(),
			deadlineTime: z.string()
		})
		.superRefine(({ deadlineDate, deadlineTime }, ctx) => {
			if (deadlineTime && !deadlineDate) {
				ctx.addIssue({
					code: "custom",
					message: "Choose a date.",
					path: ["deadlineDate"]
				});
			}
			if (deadlineDate && !deadlineTime) {
				ctx.addIssue({
					code: "custom",
					message: "Choose a time.",
					path: ["deadlineTime"]
				});
			}
		})
		.transform((values, ctx) => {
			const startDate = fromDateTimeLocalValue(
				`${values.startDate}T${values.startTime}`
			);
			const endDate = fromDateTimeLocalValue(
				`${values.endDate}T${values.endTime}`
			);
			if (!startDate || !endDate) {
				ctx.addIssue({
					code: "custom",
					message: "Choose a date.",
					path: [startDate ? "endDate" : "startDate"]
				});
				return z.NEVER;
			}
			const submissionDeadline = values.deadlineDate
				? fromDateTimeLocalValue(
						`${values.deadlineDate}T${values.deadlineTime}`
					)
				: null;
			return { startDate, endDate, submissionDeadline };
		})
		.superRefine((values, ctx) => {
			for (const { path, message } of orderIssues(values)) {
				ctx.addIssue({
					code: "custom",
					message,
					path: [path === "submissionDeadline" ? "deadlineDate" : path]
				});
			}
			const { before, after } = countEventsOutside(eventStarts, values);
			if (before > 0) {
				ctx.addIssue({
					code: "custom",
					message: `${eventsAre(before)} scheduled before this day. ${moveOrDelete(before)}`,
					path: ["startDate"]
				});
			}
			if (after > 0) {
				ctx.addIssue({
					code: "custom",
					message: `${eventsAre(after)} scheduled after this day. ${moveOrDelete(after)}`,
					path: ["endDate"]
				});
			}
		});
}

type HackathonDatesFormSchema = ReturnType<
	typeof createHackathonDatesFormSchema
>;
export type HackathonDatesFormInput = z.input<HackathonDatesFormSchema>;
export type HackathonDatesFormValues = z.output<HackathonDatesFormSchema>;

export function toHackathonDatesForm(
	settings: HackathonDateSettings | null
): HackathonDatesFormInput {
	return {
		startDate: toDateInputValue(settings?.startDate),
		startTime: toTimeInputValue(settings?.startDate),
		endDate: toDateInputValue(settings?.endDate),
		endTime: toTimeInputValue(settings?.endDate),
		deadlineDate: toDateInputValue(settings?.submissionDeadline),
		deadlineTime: toTimeInputValue(settings?.submissionDeadline)
	};
}
