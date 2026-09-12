"use client";

import { AddLine, CloseLine } from "@mingcute/react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
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
	FieldGroup,
	FieldLegend,
	FieldSet
} from "@/app/components/ui/field";
import {
	DIETARY_RESTRICTIONS,
	type DietaryRestriction
} from "@/server/db/auth-schema";
import { api } from "@/trpc/react";

export const restrictionLabels = {
	halal: "Halal",
	vegetarian: "Vegetarian",
	vegan: "Vegan",
	gluten_free: "Gluten-free",
	other: "Other"
} satisfies Record<DietaryRestriction, string>;

type DietaryRestrictionDialogueProps = {
	currentRestrictions: DietaryRestriction[];
	onCloseAction: () => void;
	onSaveAction: (dietaryRestrictions: DietaryRestriction[]) => void;
};

type DialogueMode = "edit" | "discard";

function areRestrictionsEqual(
	current: DietaryRestriction[],
	draft: DietaryRestriction[]
) {
	return (
		current.length === draft.length &&
		current.every((restriction, index) => restriction === draft[index])
	);
}

export function DietaryRestrictionDialogue({
	currentRestrictions,
	onCloseAction,
	onSaveAction
}: DietaryRestrictionDialogueProps) {
	const [draftRestrictions, setDraftRestrictions] =
		useState<DietaryRestriction[]>(currentRestrictions);
	const [dialogueMode, setDialogueMode] = useState<DialogueMode>("edit");
	const updateDietaryRestrictions =
		api.users.updateUserDietaryRestrictions.useMutation();
	const hasUnsavedChanges = !areRestrictionsEqual(
		currentRestrictions,
		draftRestrictions
	);
	const availableRestrictions = DIETARY_RESTRICTIONS.filter(
		(restriction) => !draftRestrictions.includes(restriction)
	);

	function requestEditorClose() {
		if (hasUnsavedChanges) {
			setDialogueMode("discard");
			return;
		}

		onCloseAction();
	}

	function handleDialogueOpenChange(open: boolean) {
		if (open) {
			return;
		}

		if (dialogueMode === "edit") {
			requestEditorClose();
			return;
		}

		onCloseAction();
	}

	function addRestriction(restriction: DietaryRestriction) {
		setDraftRestrictions((currentRestrictions) => {
			if (currentRestrictions.includes(restriction)) {
				return currentRestrictions;
			}

			return [...currentRestrictions, restriction];
		});
	}

	function removeRestriction(restriction: DietaryRestriction) {
		setDraftRestrictions((currentRestrictions) =>
			currentRestrictions.filter(
				(currentRestriction) => currentRestriction !== restriction
			)
		);
	}

	async function saveRestrictions() {
		try {
			await updateDietaryRestrictions.mutateAsync({
				dietaryRestrictions: draftRestrictions
			});
			onSaveAction(draftRestrictions);
			onCloseAction();
			toast.success("Dietary restrictions updated");
		} catch {
			toast.error("Unable to update dietary restrictions");
		}
	}

	function discardChanges() {
		onCloseAction();
		toast("Changes to dietary restrictions discarded");
	}

	return (
		<Dialog onOpenChange={handleDialogueOpenChange} open>
			{dialogueMode === "edit" ? (
				<DialogContent className="gap-6 p-6 sm:p-8">
					<DialogHeader className="gap-3 pr-6">
						<DialogTitle className="font-semibold text-xl leading-tight">
							Edit your dietary restrictions
						</DialogTitle>
						<DialogDescription className="font-normal text-sm">
							Update your dietary restrictions so we can accommodate your needs!
						</DialogDescription>
					</DialogHeader>

					<form
						className="flex flex-col gap-6"
						onSubmit={(event) => {
							event.preventDefault();
							void saveRestrictions();
						}}
					>
						<FieldGroup className="gap-4">
							<FieldSet>
								<FieldLegend className="font-normal text-sm" variant="label">
									Your registered dietary restrictions:
								</FieldLegend>
								<Field>
									<div className="flex min-h-5 flex-wrap gap-2">
										{draftRestrictions.length > 0 ? (
											draftRestrictions.map((restriction) => (
												<Badge
													aria-label={`Remove ${restrictionLabels[restriction]}`}
													className="h-7 cursor-pointer px-3"
													key={restriction}
													onClick={() => removeRestriction(restriction)}
													render={<button type="button" />}
													variant="accent"
												>
													{restrictionLabels[restriction]}
													<CloseLine data-icon="inline-end" />
												</Badge>
											))
										) : (
											<span className="text-muted-foreground text-sm">
												None selected
											</span>
										)}
									</div>
								</Field>
							</FieldSet>

							<FieldSet>
								<FieldLegend className="font-normal text-sm" variant="label">
									Add a restriction:
								</FieldLegend>
								<Field>
									<div className="flex flex-wrap gap-2">
										{draftRestrictions.length > 0 ? (
											<Button
												onClick={() => setDraftRestrictions([])}
												size="sm"
												type="button"
												variant="outline"
											>
												None
											</Button>
										) : null}
										{availableRestrictions.map((restriction) => (
											<Button
												key={restriction}
												onClick={() => addRestriction(restriction)}
												size="sm"
												type="button"
												variant="outline"
											>
												{restrictionLabels[restriction]}
												<AddLine data-icon="inline-end" />
											</Button>
										))}
									</div>
								</Field>
							</FieldSet>
						</FieldGroup>

						<DialogFooter className="mx-0 mb-0 flex-col border-0 bg-transparent p-0 sm:flex-col">
							<Button
								disabled={
									updateDietaryRestrictions.isPending || !hasUnsavedChanges
								}
								size="sm"
								type="submit"
							>
								{updateDietaryRestrictions.isPending
									? "Saving..."
									: "Save changes"}
							</Button>
							<Button
								disabled={updateDietaryRestrictions.isPending}
								onClick={requestEditorClose}
								size="sm"
								type="button"
								variant="outline"
							>
								Cancel
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			) : (
				<DialogContent className="gap-6 p-6 sm:p-8">
					<DialogHeader className="gap-3 pr-6">
						<DialogTitle className="font-semibold text-xl leading-tight">
							Are you sure you want to discard your changes?
						</DialogTitle>
						<DialogDescription className="font-normal text-sm">
							You’ve made edits to your dietary restrictions without saving.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter className="mx-0 mb-0 flex-col border-0 bg-transparent p-0 sm:flex-col">
						<Button
							onClick={discardChanges}
							size="sm"
							variant="destructive-solid"
						>
							Yes, discard changes
						</Button>
						<Button
							onClick={() => setDialogueMode("edit")}
							size="sm"
							variant="outline"
						>
							No, review changes
						</Button>
					</DialogFooter>
				</DialogContent>
			)}
		</Dialog>
	);
}
