"use client";

import { useState } from "react";
import { toast } from "sonner";
import { DietaryRestrictionsField } from "@/app/components/forms/DietaryRestrictionsField";
import { Button } from "@/app/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle
} from "@/app/components/ui/dialog";
import type { DietaryRestriction } from "@/lib/validation/signup";
import { api } from "@/trpc/react";

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
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Edit your dietary restrictions</DialogTitle>
						<DialogDescription>
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
						<DietaryRestrictionsField
							disabled={updateDietaryRestrictions.isPending}
							onChange={setDraftRestrictions}
							value={draftRestrictions}
						/>

						<DialogFooter>
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
				<DialogContent>
					<DialogHeader>
						<DialogTitle>
							Are you sure you want to discard your changes?
						</DialogTitle>
						<DialogDescription>
							You’ve made edits to your dietary restrictions without saving.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
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
