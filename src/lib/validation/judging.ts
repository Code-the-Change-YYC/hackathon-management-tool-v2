import { z } from "zod";
import { fromDateTimeLocalValue } from "@/lib/datetime";
import {
	JUDGING_ROUND_KINDS,
	MAIN_CRITERION_MAX_SCORE,
	MAX_PRESENTATION_MINUTES
} from "@/lib/judging";
import { dateField, type HackathonDates, timeField } from "./event";

export const ROUND_NAME_MAX_LENGTH = 120;
export const CRITERION_NAME_MAX_LENGTH = 120;
export const CRITERION_DESCRIPTION_MAX_LENGTH = 1000;

const wholeNumber = (min: number) =>
	z
		.number({ message: "Enter a number." })
		.int("Enter a whole number.")
		.min(min, `Enter ${min} or more.`);

// Number fields hold null while empty.
const numberField = (min: number) =>
	z.number().nullable().pipe(wholeNumber(min));

function toDateTime(date: string, time: string, ctx: z.RefinementCtx) {
	const value = fromDateTimeLocalValue(`${date}T${time}`);
	if (!value) {
		ctx.addIssue({ code: "custom", message: "Choose a date.", path: ["date"] });
		return z.NEVER;
	}
	return value;
}

// Panel rounds set a window for the schedule generator. A final round sets
// its presentation length, and its end follows from the finalists.
export function createRoundFormSchema(hackathonDates: HackathonDates | null) {
	return (
		z
			.object({
				kind: z.enum(JUDGING_ROUND_KINDS),
				name: z
					.string()
					.trim()
					.min(1, "Enter a name.")
					.max(ROUND_NAME_MAX_LENGTH),
				date: dateField(hackathonDates),
				startTime: timeField("Choose a start time."),
				endTime: z.string(),
				presentationMinutes: z.number().nullable(),
				changeoverMinutes: z.number().nullable()
			})
			.superRefine((data, ctx) => {
				function check(schema: z.ZodType, path: keyof typeof data) {
					const value = data[path];
					for (const issue of schema.safeParse(value).error?.issues ?? []) {
						ctx.addIssue({
							code: "custom",
							message: issue.message,
							path: [path]
						});
					}
				}
				if (data.kind === "final") {
					check(numberField(1), "presentationMinutes");
					check(numberField(0), "changeoverMinutes");
					return;
				}
				check(timeField("Choose an end time."), "endTime");
				if (data.endTime && data.endTime <= data.startTime) {
					ctx.addIssue({
						code: "custom",
						message: "End time must be after start time.",
						path: ["endTime"]
					});
				}
			})
			// Times fall on the one date, in Calgary time.
			.transform((data, ctx) =>
				data.kind === "panel"
					? {
							kind: "panel" as const,
							name: data.name,
							startTime: toDateTime(data.date, data.startTime, ctx),
							endTime: toDateTime(data.date, data.endTime, ctx)
						}
					: {
							kind: "final" as const,
							name: data.name,
							startTime: toDateTime(data.date, data.startTime, ctx),
							presentationMinutes: data.presentationMinutes ?? 0,
							changeoverMinutes: data.changeoverMinutes ?? 0
						}
			)
	);
}

type RoundFormSchema = ReturnType<typeof createRoundFormSchema>;
export type RoundFormInput = z.input<RoundFormSchema>;
export type RoundFormValues = z.output<RoundFormSchema>;

export const EMPTY_ROUND_FORM: RoundFormInput = {
	kind: "panel",
	name: "",
	date: "",
	startTime: "",
	endTime: "",
	presentationMinutes: MAX_PRESENTATION_MINUTES,
	changeoverMinutes: 2
};

export const scheduleSettingsSchema = z.object({
	panelSize: numberField(1),
	changeoverMinutes: numberField(0),
	breakMinutes: numberField(0),
	maxBlockMinutes: numberField(1)
});

export type ScheduleSettingsInput = z.input<typeof scheduleSettingsSchema>;
export type ScheduleSettingsValues = z.output<typeof scheduleSettingsSchema>;

export const finalistsFormSchema = z.object({
	teamIds: z.array(z.string()).min(1, "Pick at least one finalist.")
});

export type FinalistsFormValues = z.infer<typeof finalistsFormSchema>;

export const criterionFormSchema = z
	.object({
		name: z
			.string()
			.trim()
			.min(1, "Enter a name.")
			.max(CRITERION_NAME_MAX_LENGTH),
		description: z.string().trim().max(CRITERION_DESCRIPTION_MAX_LENGTH),
		displayOrder: numberField(0),
		isSidepot: z.boolean(),
		maxScore: z.number().nullable()
	})
	.superRefine((data, ctx) => {
		if (!data.isSidepot) return;
		const result = wholeNumber(1)
			.max(100, "Enter 100 or less.")
			.safeParse(data.maxScore);
		if (!result.success) {
			ctx.addIssue({
				code: "custom",
				message: result.error.issues[0]?.message ?? "Enter a number.",
				path: ["maxScore"]
			});
		}
	})
	// Main criteria are always scored out of the same maximum.
	.transform(({ maxScore, ...data }) => ({
		...data,
		maxScore: data.isSidepot
			? (maxScore ?? MAIN_CRITERION_MAX_SCORE)
			: MAIN_CRITERION_MAX_SCORE
	}));

export type CriterionFormInput = z.input<typeof criterionFormSchema>;
export type CriterionFormValues = z.output<typeof criterionFormSchema>;
