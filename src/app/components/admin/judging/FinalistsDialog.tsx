"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useController, useForm } from "react-hook-form";
import { toast } from "sonner";
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
import { Field, FieldError, FieldLabel } from "@/app/components/ui/field";
import { useRefresh } from "@/hooks/use-refresh";
import { formatDateTime } from "@/lib/datetime";
import { DEFAULT_FINALIST_COUNT } from "@/lib/judging";
import {
	type FinalistsFormValues,
	finalistsFormSchema
} from "@/lib/validation/judging";
import { api } from "@/trpc/react";
import { formatScore, type PanelRanking, type Round } from "./judgingShared";

export function FinalistsDialog({
	finalRound,
	ranking,
	hasFinalists,
	onClose,
	onSaved
}: {
	finalRound: Round;
	ranking: PanelRanking[];
	hasFinalists: boolean;
	onClose: () => void;
	onSaved: (roundId: string) => void;
}) {
	const { isRefreshing, refresh } = useRefresh();
	const form = useForm<FinalistsFormValues>({
		defaultValues: {
			teamIds: ranking
				.filter((entry) => entry.normalizedScore !== null)
				.slice(0, DEFAULT_FINALIST_COUNT)
				.map((entry) => entry.teamId)
		},
		resolver: zodResolver(finalistsFormSchema)
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
				toast.success("Finalists saved.");
				onSaved(roundId);
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
						{hasFinalists ? "Change finalists" : "Pick finalists"}
					</DialogTitle>
					<DialogDescription>
						{hasFinalists
							? `This replaces the current finalists and unpublishes ${finalRound.name}.`
							: `Finalists present in ranking order to every judge, from ${formatDateTime(finalRound.startTime)}.`}
					</DialogDescription>
				</DialogHeader>
				<form
					className="flex flex-col gap-6"
					noValidate
					onSubmit={form.handleSubmit((values) =>
						setFinalists.mutate({
							// Finalists present in ranking order.
							teamIds: ranking
								.filter((entry) => values.teamIds.includes(entry.teamId))
								.map((entry) => entry.teamId)
						})
					)}
				>
					<Field data-invalid={teamIdsState.invalid}>
						<FieldLabel id="finalists-label">
							Finalists · {selected.size} selected
						</FieldLabel>
						<ul
							aria-labelledby="finalists-label"
							className="m-0 flex max-h-80 list-none flex-col overflow-y-auto rounded-lg border border-input p-1"
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
					<DialogFooter>
						<Button disabled={isPending} type="submit">
							Save finalists
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
