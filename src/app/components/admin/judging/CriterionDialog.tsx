"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useController, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { CheckboxField } from "@/app/components/forms/CheckboxField";
import { NumberField } from "@/app/components/forms/NumberField";
import { TextField } from "@/app/components/forms/TextField";
import { Button } from "@/app/components/ui/button";
import { Checkbox } from "@/app/components/ui/checkbox";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle
} from "@/app/components/ui/dialog";
import {
	Field,
	FieldDescription,
	FieldError,
	FieldGroup,
	FieldLabel,
	FieldLegend,
	FieldSet
} from "@/app/components/ui/field";
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
import { useRefresh } from "@/hooks/use-refresh";
import { MAIN_CRITERION_MAX_SCORE } from "@/lib/judging";
import {
	CRITERION_DESCRIPTION_MAX_LENGTH,
	CRITERION_NAME_MAX_LENGTH,
	type CriterionFormInput,
	type CriterionFormValues,
	criterionFormSchema
} from "@/lib/validation/judging";
import { api } from "@/trpc/react";
import type { Criterion, Round } from "./judgingShared";

function toFormInput(
	criterion: Criterion | undefined,
	nextDisplayOrder: number
): CriterionFormInput {
	return {
		name: criterion?.name ?? "",
		description: criterion?.description ?? "",
		displayOrder: criterion?.displayOrder ?? nextDisplayOrder,
		isSidepot: criterion?.isSidepot ?? false,
		maxScore: criterion?.isSidepot
			? criterion.maxScore
			: MAIN_CRITERION_MAX_SCORE,
		roundIds: criterion?.roundIds ?? []
	};
}

export function CriterionDialog({
	criterion,
	rounds,
	nextDisplayOrder,
	onClose
}: {
	criterion?: Criterion;
	rounds: Round[];
	nextDisplayOrder: number;
	onClose: () => void;
}) {
	const { isRefreshing, refresh } = useRefresh();
	const form = useForm<CriterionFormInput, unknown, CriterionFormValues>({
		defaultValues: toFormInput(criterion, nextDisplayOrder),
		resolver: zodResolver(criterionFormSchema)
	});
	const isSidepot = useWatch({ control: form.control, name: "isSidepot" });
	const { field: roundIds } = useController({
		control: form.control,
		name: "roundIds"
	});
	const callbacks = {
		onSuccess: () =>
			refresh(() => {
				toast.success(criterion ? "Criterion updated." : "Criterion added.");
				onClose();
			}),
		onError: (error: { message: string }) => toast.error(error.message)
	};
	const createCriterion = api.criteria.create.useMutation(callbacks);
	const updateCriterion = api.criteria.update.useMutation(callbacks);
	const isPending =
		createCriterion.isPending || updateCriterion.isPending || isRefreshing;
	const descriptionError = form.formState.errors.description;
	// Older main criteria can have another maximum, which saving resets.
	const oldMainMax =
		criterion && !criterion.isSidepot && !isSidepot
			? criterion.maxScore
			: MAIN_CRITERION_MAX_SCORE;

	return (
		<Dialog
			disablePointerDismissal
			onOpenChange={(open) => !open && onClose()}
			open
		>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>
						{criterion ? "Edit criterion" : "Add criterion"}
					</DialogTitle>
				</DialogHeader>
				<form
					className="flex flex-col gap-6"
					noValidate
					onSubmit={form.handleSubmit((values) =>
						criterion
							? updateCriterion.mutate({ id: criterion.id, ...values })
							: createCriterion.mutate(values)
					)}
				>
					<FieldGroup className="gap-5">
						<TextField
							control={form.control}
							disabled={isPending}
							label="Name"
							maxLength={CRITERION_NAME_MAX_LENGTH}
							name="name"
							placeholder="Technical execution"
						/>
						<Field data-invalid={Boolean(descriptionError)}>
							<FieldLabel htmlFor="criterion-description">
								Description (optional)
							</FieldLabel>
							<Textarea
								aria-invalid={Boolean(descriptionError)}
								disabled={isPending}
								id="criterion-description"
								maxLength={CRITERION_DESCRIPTION_MAX_LENGTH}
								placeholder="What should judges look for?"
								{...form.register("description")}
							/>
							<FieldDescription>
								Judges see this while scoring. Leave it blank for a general
								prompt.
							</FieldDescription>
							<FieldError errors={[descriptionError]} />
						</Field>
						<CheckboxField
							control={form.control}
							disabled={isPending}
							name="isSidepot"
						>
							Sidepot
							<span className="block text-muted-foreground">
								A separate prize. It doesn’t count toward the ranking.
							</span>
						</CheckboxField>
						<div className="grid gap-4 sm:grid-cols-2">
							{isSidepot ? (
								<NumberField
									control={form.control}
									disabled={isPending}
									label="Maximum score"
									max={100}
									min={1}
									name="maxScore"
								/>
							) : (
								<Field data-disabled>
									<FieldLabel htmlFor="criterion-main-max">
										Maximum score
									</FieldLabel>
									<Input
										disabled
										id="criterion-main-max"
										readOnly
										value={MAIN_CRITERION_MAX_SCORE}
									/>
									<FieldDescription>
										{oldMainMax === MAIN_CRITERION_MAX_SCORE
											? "Fixed for main criteria."
											: `Now out of ${oldMainMax}. Saving changes it to ${MAIN_CRITERION_MAX_SCORE}.`}
									</FieldDescription>
								</Field>
							)}
							<div className="flex flex-col gap-2">
								<NumberField
									control={form.control}
									disabled={isPending}
									label="Display order"
									min={0}
									name="displayOrder"
								/>
								<FieldDescription>
									Lowest first. Sidepots always go last.
								</FieldDescription>
							</div>
						</div>
						{rounds.length ? (
							<FieldSet className="gap-3">
								<FieldLegend className="mb-0" variant="label">
									Rounds
								</FieldLegend>
								<FieldDescription>
									Leave all unchecked to use it in every round.
								</FieldDescription>
								{rounds.map((round) => (
									<Field key={round.id} orientation="horizontal">
										<Checkbox
											checked={roundIds.value.includes(round.id)}
											disabled={isPending}
											id={`criterion-round-${round.id}`}
											onCheckedChange={(checked) =>
												roundIds.onChange(
													checked
														? [...roundIds.value, round.id]
														: roundIds.value.filter((id) => id !== round.id)
												)
											}
										/>
										<FieldLabel
											className="font-normal"
											htmlFor={`criterion-round-${round.id}`}
										>
											{round.name}
										</FieldLabel>
									</Field>
								))}
							</FieldSet>
						) : null}
					</FieldGroup>
					<DialogFooter>
						<Button disabled={isPending} type="submit">
							{criterion ? "Save changes" : "Add criterion"}
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
