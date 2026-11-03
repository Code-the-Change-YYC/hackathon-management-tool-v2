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
import {
	type FinalJudgesFormValues,
	finalJudgesFormSchema
} from "@/lib/validation/judging";
import { api } from "@/trpc/react";
import type { Judge } from "./judgingShared";

export function FinalJudgesDialog({
	judges,
	seatedIds,
	rankedIds,
	onClose
}: {
	judges: Judge[];
	seatedIds: string[];
	rankedIds: string[];
	onClose: () => void;
}) {
	const { isRefreshing, refresh } = useRefresh();
	const form = useForm<FinalJudgesFormValues>({
		defaultValues: { judgeIds: seatedIds },
		resolver: zodResolver(finalJudgesFormSchema)
	});
	const { field: judgeIds, fieldState: judgeIdsState } = useController({
		control: form.control,
		name: "judgeIds"
	});
	const selected = new Set(judgeIds.value);
	const ranked = new Set(rankedIds);
	const setFinalJudges = api.judgingResults.setFinalJudges.useMutation({
		onError: (error) => toast.error(error.message),
		onSuccess: () =>
			refresh(() => {
				toast.success("Final table updated.");
				onClose();
			})
	});
	const isPending = setFinalJudges.isPending || isRefreshing;

	return (
		<Dialog
			disablePointerDismissal
			onOpenChange={(open) => !open && onClose()}
			open
		>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Final table judges</DialogTitle>
					<DialogDescription>
						Only these judges rank the finalists. Judges who have already ranked
						them stay seated.
					</DialogDescription>
				</DialogHeader>
				<form
					className="flex flex-col gap-6"
					noValidate
					onSubmit={form.handleSubmit((values) =>
						setFinalJudges.mutate(values)
					)}
				>
					<Field data-invalid={judgeIdsState.invalid}>
						<FieldLabel id="final-judges-label">
							Judges · {selected.size} seated
						</FieldLabel>
						<ul
							aria-labelledby="final-judges-label"
							className="m-0 flex max-h-80 list-none flex-col overflow-y-auto rounded-lg border border-input p-1"
						>
							{judges.map((judge) => {
								const id = `final-judge-${judge.id}`;
								return (
									<li key={judge.id}>
										<label
											className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-1.5 hover:bg-muted"
											htmlFor={id}
										>
											<Checkbox
												checked={selected.has(judge.id)}
												disabled={isPending || ranked.has(judge.id)}
												id={id}
												onCheckedChange={(checked) =>
													judgeIds.onChange(
														checked
															? [...judgeIds.value, judge.id]
															: judgeIds.value.filter(
																	(judgeId) => judgeId !== judge.id
																)
													)
												}
											/>
											<span className="min-w-0 flex-1 truncate">
												{judge.name}
											</span>
											{ranked.has(judge.id) ? (
												<span className="text-muted-foreground text-sm">
													Ranked
												</span>
											) : null}
										</label>
									</li>
								);
							})}
						</ul>
						<FieldError errors={[judgeIdsState.error]} />
					</Field>
					<DialogFooter>
						<Button disabled={isPending} type="submit">
							Save judges
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
