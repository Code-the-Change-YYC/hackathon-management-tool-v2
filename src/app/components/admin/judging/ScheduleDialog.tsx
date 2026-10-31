"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { keepPreviousData } from "@tanstack/react-query";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { NumberField } from "@/app/components/forms/NumberField";
import { Button } from "@/app/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle
} from "@/app/components/ui/dialog";
import { FieldGroup } from "@/app/components/ui/field";
import { useRefresh } from "@/hooks/use-refresh";
import { formatTime } from "@/lib/datetime";
import {
	type ScheduleSettingsInput,
	type ScheduleSettingsValues,
	scheduleSettingsSchema
} from "@/lib/validation/judging";
import { api, type RouterOutputs } from "@/trpc/react";
import { plural, type Round } from "./judgingShared";

// Only sent while disabled, so the query input keeps one shape.
const SETTINGS_PLACEHOLDER: ScheduleSettingsValues = {
	panelSize: 1,
	changeoverMinutes: 0,
	breakMinutes: 0,
	maxBlockMinutes: 1
};

function Preview({
	data,
	error
}: {
	data?: RouterOutputs["judgingTables"]["previewSchedule"];
	error: { message: string } | null;
}) {
	if (!data) {
		return (
			<p className="m-0 text-muted-foreground">
				{error ? error.message : "Calculating…"}
			</p>
		);
	}

	const { judgeCount, teamCount, result } = data;
	const counts = `${plural(teamCount, "team")} · ${plural(judgeCount, "judge")}`;
	if (!result.ok) {
		return (
			<>
				<p className="m-0 font-medium text-destructive">{result.message}</p>
				<p className="m-0 text-muted-foreground">{counts}</p>
			</>
		);
	}

	const { schedule } = result;
	return (
		<>
			<p className="m-0 font-medium">
				{plural(schedule.tables.length, "table")} ·{" "}
				{schedule.presentationMinutes}-minute presentations
			</p>
			<p className="m-0 text-muted-foreground">
				Ends {formatTime(schedule.endsAt)}
				{schedule.breaks.length
					? ` · Breaks at ${schedule.breaks.map((pause) => formatTime(pause.startsAt)).join(", ")}`
					: ""}{" "}
				· {counts}
			</p>
		</>
	);
}

export function ScheduleDialog({
	round,
	hasSchedule,
	onClose
}: {
	round: Round;
	hasSchedule: boolean;
	onClose: () => void;
}) {
	const { isRefreshing, refresh } = useRefresh();
	const form = useForm<ScheduleSettingsInput, unknown, ScheduleSettingsValues>({
		defaultValues: {
			panelSize: round.panelSize ?? 4,
			changeoverMinutes: round.changeoverMinutes,
			breakMinutes: round.breakMinutes,
			maxBlockMinutes: round.maxBlockMinutes
		},
		resolver: zodResolver(scheduleSettingsSchema)
	});
	const values = useWatch({ control: form.control });
	const settings = scheduleSettingsSchema.safeParse(values);
	const preview = api.judgingTables.previewSchedule.useQuery(
		{
			roundId: round.id,
			...(settings.success ? settings.data : SETTINGS_PLACEHOLDER)
		},
		{ enabled: settings.success, placeholderData: keepPreviousData }
	);
	const fits =
		settings.success &&
		!preview.isPlaceholderData &&
		preview.data?.result.ok === true;
	const generate = api.judgingTables.generateSchedule.useMutation({
		onError: (error) => toast.error(error.message),
		onSuccess: () =>
			refresh(() => {
				toast.success(
					hasSchedule ? "Schedule regenerated." : "Schedule generated."
				);
				onClose();
			})
	});
	const isPending = generate.isPending || isRefreshing;

	return (
		<Dialog
			disablePointerDismissal
			onOpenChange={(open) => !open && onClose()}
			open
		>
			<DialogContent className="sm:max-w-lg">
				<DialogHeader>
					<DialogTitle>
						{hasSchedule ? "Regenerate schedule" : "Generate schedule"}
					</DialogTitle>
					<DialogDescription>
						{hasSchedule
							? round.publishedAt
								? "Every team’s time and table will change, and teams have already seen their current times."
								: "This replaces the current tables and times."
							: "Each team presents twice, back to back, at two different tables."}
					</DialogDescription>
				</DialogHeader>
				<form
					className="flex flex-col gap-6"
					noValidate
					onSubmit={form.handleSubmit((values) => {
						if (!fits) return;
						generate.mutate({
							roundId: round.id,
							...values,
							confirm: Boolean(round.publishedAt)
						});
					})}
				>
					<FieldGroup className="grid gap-4 sm:grid-cols-2">
						<NumberField
							control={form.control}
							disabled={isPending}
							label="Judges per table"
							min={1}
							name="panelSize"
						/>
						<NumberField
							control={form.control}
							disabled={isPending}
							label="Changeover (min)"
							min={0}
							name="changeoverMinutes"
						/>
						<NumberField
							control={form.control}
							disabled={isPending}
							label="Break length (min)"
							min={0}
							name="breakMinutes"
						/>
						<NumberField
							control={form.control}
							disabled={isPending}
							label="Judging between breaks (min)"
							min={1}
							name="maxBlockMinutes"
						/>
					</FieldGroup>
					{settings.success ? (
						<div
							aria-live="polite"
							className="flex flex-col gap-1 rounded-lg bg-muted/50 p-4 text-sm"
						>
							<Preview data={preview.data} error={preview.error} />
						</div>
					) : null}
					<DialogFooter>
						{/* Invalid fields can still submit, to show their errors. */}
						<Button
							disabled={isPending || (settings.success && !fits)}
							type="submit"
						>
							{hasSchedule ? "Regenerate" : "Generate"}
						</Button>
						<Button onClick={onClose} type="button" variant="outline">
							Cancel
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
