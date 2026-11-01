import { z } from "zod";
import { fromDateTimeLocalValue } from "@/lib/datetime";
import { MAIN_CRITERION_MAX_SCORE } from "@/lib/judging";
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

export function createRoundFormSchema(hackathonDates: HackathonDates | null) {
	return (
		z
			.object({
				name: z
					.string()
					.trim()
					.min(1, "Enter a name.")
					.max(ROUND_NAME_MAX_LENGTH),
				date: dateField(hackathonDates),
				startTime: timeField("Choose a start time."),
				endTime: timeField("Choose an end time.")
			})
			.refine((data) => data.endTime > data.startTime, {
				message: "End time must be after start time.",
				path: ["endTime"]
			})
			// Both times fall on the one date, in Calgary time.
			.transform(({ date, startTime, endTime, name }, ctx) => ({
				name,
				startTime: toDateTime(date, startTime, ctx),
				endTime: toDateTime(date, endTime, ctx)
			}))
	);
}

type RoundFormSchema = ReturnType<typeof createRoundFormSchema>;
export type RoundFormInput = z.input<RoundFormSchema>;
export type RoundFormValues = z.output<RoundFormSchema>;

export const EMPTY_ROUND_FORM: RoundFormInput = {
	name: "",
	date: "",
	startTime: "",
	endTime: ""
};

export const scheduleSettingsSchema = z.object({
	panelSize: numberField(1),
	changeoverMinutes: numberField(0),
	breakMinutes: numberField(0),
	maxBlockMinutes: numberField(1)
});

export type ScheduleSettingsInput = z.input<typeof scheduleSettingsSchema>;
export type ScheduleSettingsValues = z.output<typeof scheduleSettingsSchema>;

export function createFinalistsFormSchema(
	hackathonDates: HackathonDates | null
) {
	return z
		.object({
			teamIds: z.array(z.string()).min(1, "Pick at least one finalist."),
			date: dateField(hackathonDates),
			startTime: timeField("Choose a start time."),
			presentationMinutes: numberField(1),
			changeoverMinutes: numberField(0)
		})
		.transform(({ date, startTime, ...data }, ctx) => ({
			...data,
			startTime: toDateTime(date, startTime, ctx)
		}));
}

type FinalistsFormSchema = ReturnType<typeof createFinalistsFormSchema>;
export type FinalistsFormInput = z.input<FinalistsFormSchema>;
export type FinalistsFormValues = z.output<FinalistsFormSchema>;

export const FINALISTS_FORM_DEFAULTS = {
	presentationMinutes: 10,
	changeoverMinutes: 2
};

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
		maxScore: z.number().nullable(),
		roundIds: z.array(z.string())
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
