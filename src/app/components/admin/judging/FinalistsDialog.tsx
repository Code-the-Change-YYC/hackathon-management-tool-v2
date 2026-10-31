"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useController, useForm } from "react-hook-form";
import { toast } from "sonner";
import { DateField } from "@/app/components/forms/DateField";
import { NumberField } from "@/app/components/forms/NumberField";
import { TimeField } from "@/app/components/forms/TimeField";
import { Button } from "@/app/components/ui/button";
import { Checkbox } from "@/app/components/ui/checkbox";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle
} from "@/app/components/ui/dialog";
import {
	Field,
	FieldError,
	FieldGroup,
	FieldLabel
} from "@/app/components/ui/field";
import { useRefresh } from "@/hooks/use-refresh";
import { toDateInputValue } from "@/lib/datetime";
import { DEFAULT_FINALIST_COUNT } from "@/lib/judging";
import type { HackathonDates } from "@/lib/validation/event";
import {
	createFinalistsFormSchema,
	FINALISTS_FORM_DEFAULTS,
	type FinalistsFormInput,
	type FinalistsFormValues
} from "@/lib/validation/judging";
import { api } from "@/trpc/react";
import { formatScore, type PanelRanking, type Round } from "./judgingShared";

export function FinalistsDialog({
	panelRound,
	ranking,
	hasFinalRound,
	hackathonDates,
	onClose,
	onCreated
}: {
	panelRound: Round;
	ranking: PanelRanking[];
	hasFinalRound: boolean;
	hackathonDates: HackathonDates | null;
	onClose: () => void;
	onCreated: (roundId: string) => void;
}) {
	const { isRefreshing, refresh } = useRefresh();
	const form = useForm<FinalistsFormInput, unknown, FinalistsFormValues>({
		defaultValues: {
			...FINALISTS_FORM_DEFAULTS,
			teamIds: ranking
				.filter((entry) => entry.normalizedScore !== null)
				.slice(0, DEFAULT_FINALIST_COUNT)
				.map((entry) => entry.teamId),
			date: toDateInputValue(panelRound.endTime),
			startTime: ""
		},
		resolver: zodResolver(createFinalistsFormSchema(hackathonDates))
	});
	const { field: teamIds, fieldState: teamIdsState } = useController({
		control: form.control,
		name: "teamIds"
	});
	const selected = new Set(teamIds.value);
	const setFinalists = api.judgingResults.setFinalists.useMutation({
		onError: (error) => toast.error(error.message),
		onSuccess: ({ roundId }) =>
			refresh(() => {
				toast.success(
					hasFinalRound ? "Final round replaced." : "Final round created."
				);
				onCreated(roundId);
				onClose();
			})
	});
	const isPending = setFinalists.isPending || isRefreshing;

	return (
		<Dialog
			disablePointerDismissal
			onOpenChange={(open) => !open && onClose()}
			open
		>
			<DialogContent className="sm:max-w-xl">
				<DialogHeader>
					<DialogTitle>
						{hasFinalRound ? "Replace final round" : "Create final round"}
					</DialogTitle>
					<DialogDescription>
						{hasFinalRound
							? "This replaces the current finalists and times, and unpublishes the final round."
							: "Finalists present one after another to every judge."}
					</DialogDescription>
				</DialogHeader>
				<form
					className="flex flex-col gap-6"
					noValidate
					onSubmit={form.handleSubmit((values) =>
						setFinalists.mutate({
							...values,
							// Finalists present in ranking order.
							teamIds: ranking
								.filter((entry) => values.teamIds.includes(entry.teamId))
								.map((entry) => entry.teamId)
						})
					)}
				>
					<FieldGroup className="gap-4">
						<Field data-invalid={teamIdsState.invalid}>
							<FieldLabel id="finalists-label">
								Finalists · {selected.size} selected
							</FieldLabel>
							<ul
								aria-labelledby="finalists-label"
								className="m-0 flex max-h-64 list-none flex-col overflow-y-auto rounded-lg border border-input p-1"
							>
								{ranking.map((entry, index) => {
									const id = `finalist-${entry.teamId}`;
									return (
										<li key={entry.teamId}>
											<label
												className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-1.5 hover:bg-muted"
												htmlFor={id}
											>
												<Checkbox
													checked={selected.has(entry.teamId)}
													disabled={isPending}
													id={id}
													onCheckedChange={(checked) =>
														teamIds.onChange(
															checked
																? [...teamIds.value, entry.teamId]
																: teamIds.value.filter(
																		(teamId) => teamId !== entry.teamId
																	)
														)
													}
												/>
												<span className="w-6 text-muted-foreground tabular-nums">
													{entry.normalizedScore === null ? "—" : index + 1}
												</span>
												<span className="min-w-0 flex-1 truncate">
													{entry.teamName}
												</span>
												<span className="text-muted-foreground tabular-nums">
													{formatScore(entry.normalizedScore)}
												</span>
											</label>
										</li>
									);
								})}
							</ul>
							<FieldError errors={[teamIdsState.error]} />
						</Field>
						<div className="grid gap-4 sm:grid-cols-2">
							<DateField
								control={form.control}
								disabled={isPending}
								label="Date"
								max={hackathonDates?.end}
								min={hackathonDates?.start}
								name="date"
							/>
							<TimeField
								control={form.control}
								disabled={isPending}
								label="Starts"
								name="startTime"
							/>
							<NumberField
								control={form.control}
								disabled={isPending}
								label="Presentation (min)"
								min={1}
								name="presentationMinutes"
							/>
							<NumberField
								control={form.control}
								disabled={isPending}
								label="Changeover (min)"
								min={0}
								name="changeoverMinutes"
							/>
						</div>
					</FieldGroup>
					<DialogFooter>
						<Button disabled={isPending} type="submit">
							{hasFinalRound ? "Replace final round" : "Create final round"}
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
