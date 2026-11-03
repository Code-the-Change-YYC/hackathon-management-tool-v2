"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useId } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import {
	ConfirmAlertDialog,
	useConfirmDialog
} from "@/app/components/ConfirmAlertDialog";
import { DateField } from "@/app/components/forms/DateField";
import { TimeField } from "@/app/components/forms/TimeField";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardHeader } from "@/app/components/ui/card";
import { FieldGroup, FieldLegend, FieldSet } from "@/app/components/ui/field";
import { useRefresh } from "@/hooks/use-refresh";
import { formatDateTime } from "@/lib/datetime";
import {
	createHackathonDatesFormSchema,
	type HackathonDateSettings,
	type HackathonDatesFormInput,
	type HackathonDatesFormValues,
	toHackathonDatesForm
} from "@/lib/validation/hackathon-dates";
import { api } from "@/trpc/react";

const DATE_FIELDS = [
	{ legend: "Hackathon start", date: "startDate", time: "startTime" },
	{ legend: "Hackathon end", date: "endDate", time: "endTime" },
	{ legend: "Submission deadline", date: "deadlineDate", time: "deadlineTime" }
] as const;

const CHANGE_LABELS = {
	startDate: "Start",
	endDate: "End",
	submissionDeadline: "Submission deadline"
} as const;

type SettingKey = keyof typeof CHANGE_LABELS;

function formatSetting(value?: Date | null) {
	return value ? formatDateTime(value) : "Not set";
}

export function HackathonDatesCard({
	settings,
	eventStarts
}: {
	settings: HackathonDateSettings | null;
	eventStarts: Date[];
}) {
	const formId = useId();
	const { isRefreshing, refresh } = useRefresh();
	const { confirm, dialogProps } = useConfirmDialog();
	const form = useForm<
		HackathonDatesFormInput,
		unknown,
		HackathonDatesFormValues
	>({
		defaultValues: toHackathonDatesForm(settings),
		resolver: zodResolver(createHackathonDatesFormSchema(eventStarts))
	});
	const updateDates = api.hackathonSettings.updateDates.useMutation({
		onSuccess: (_, values) => {
			toast.success("Hackathon dates updated.");
			refresh(() => form.reset(toHackathonDatesForm(values)));
		},
		onError: (error) =>
			toast.error(
				error.data?.code === "BAD_REQUEST" && !error.data.zodError
					? error.message
					: "We couldn’t save the hackathon dates. Please try again."
			)
	});
	const isPending = updateDates.isPending || isRefreshing;

	const save = form.handleSubmit(async (values) => {
		const changes = (Object.keys(CHANGE_LABELS) as SettingKey[]).filter(
			(key) => values[key]?.getTime() !== settings?.[key]?.getTime()
		);
		if (changes.length === 0) return;

		const confirmed = await confirm({
			title: "Update hackathon dates?",
			description: "Participants will see the new dates right away.",
			details: (
				<dl className="flex flex-col gap-3 text-sm">
					{changes.map((key) => (
						<div key={key}>
							<dt className="font-medium">{CHANGE_LABELS[key]}</dt>
							<dd className="text-muted-foreground">
								{formatSetting(settings?.[key])}
								<span aria-hidden="true"> → </span>
								<span className="sr-only"> to </span>
								{formatSetting(values[key])}
							</dd>
						</div>
					))}
				</dl>
			),
			confirmLabel: "Save dates"
		});
		if (confirmed) updateDates.mutate(values);
	});

	return (
		<section aria-labelledby="hackathon-dates-title">
			<Card>
				<CardHeader className="flex flex-wrap items-center justify-between gap-3">
					<h2
						className="font-medium text-[22px] leading-7"
						id="hackathon-dates-title"
					>
						Hackathon Dates
					</h2>
					<Button
						disabled={!form.formState.isDirty || isPending}
						form={formId}
						size="sm"
						type="submit"
					>
						Save dates
					</Button>
				</CardHeader>
				<CardContent>
					<form
						className="grid gap-6 xl:grid-cols-3"
						id={formId}
						noValidate
						onSubmit={save}
					>
						{DATE_FIELDS.map(({ legend, date, time }) => (
							<FieldSet disabled={isPending} key={legend}>
								<FieldLegend>{legend}</FieldLegend>
								<FieldGroup className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_10rem] xl:grid-cols-1">
									<DateField
										control={form.control}
										disabled={isPending}
										label="Date"
										name={date}
									/>
									<TimeField
										control={form.control}
										disabled={isPending}
										label="Time"
										name={time}
									/>
								</FieldGroup>
							</FieldSet>
						))}
					</form>
				</CardContent>
			</Card>
			<ConfirmAlertDialog {...dialogProps} />
		</section>
	);
}
