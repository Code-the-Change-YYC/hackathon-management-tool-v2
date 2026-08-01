"use client";

import { AddLine, CloseLine, Edit2Line } from "@mingcute/react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import {
	Card,
	CardAction,
	CardContent,
	CardHeader,
	CardTitle
} from "@/app/components/ui/card";
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
import { api } from "@/trpc/react";

const restrictionOptions = [
	"Vegetarian",
	"Vegan",
	"Halal",
	"Dairy-free",
	"Nut-Allergy"
];

type DietaryRestrictionProps = {
	allergies: string | null | undefined;
};

type DialogMode = "edit" | "discard" | null;

function getDietaryRestrictions(allergies: string | null | undefined) {
	const restrictions =
		allergies
			?.split(",")
			.map((restriction) => restriction.trim())
			.filter(Boolean) ?? [];

	return restrictions.filter(
		(restriction, index) =>
			restrictions.findIndex(
				(candidate) => candidate.toLowerCase() === restriction.toLowerCase()
			) === index
	);
}

function areRestrictionsEqual(current: string[], draft: string[]) {
	return (
		current.length === draft.length &&
		current.every((restriction, index) => restriction === draft[index])
	);
}

export function DietaryRestriction({ allergies }: DietaryRestrictionProps) {
	const [dietaryRestrictions, setDietaryRestrictions] = useState(() =>
		getDietaryRestrictions(allergies)
	);
	const [draftRestrictions, setDraftRestrictions] = useState<string[]>([]);
	const [dialogMode, setDialogMode] = useState<DialogMode>(null);
	const updateAllergies = api.users.updateUserAllergies.useMutation();
	const hasUnsavedChanges = !areRestrictionsEqual(
		dietaryRestrictions,
		draftRestrictions
	);
	const availableRestrictions = restrictionOptions.filter(
		(option) =>
			!draftRestrictions.some(
				(restriction) => restriction.toLowerCase() === option.toLowerCase()
			)
	);

	function openEditor() {
		setDraftRestrictions(dietaryRestrictions);
		setDialogMode("edit");
	}

	function requestEditorClose() {
		if (hasUnsavedChanges) {
			setDialogMode("discard");
			return;
		}

		setDialogMode(null);
	}

	function handleDialogOpenChange(open: boolean) {
		if (open) {
			return;
		}

		if (dialogMode === "edit") {
			requestEditorClose();
			return;
		}

		setDialogMode(null);
	}

	function addRestriction(restriction: string) {
		setDraftRestrictions((current) => [...current, restriction]);
	}

	function removeRestriction(restriction: string) {
		setDraftRestrictions((current) =>
			current.filter((candidate) => candidate !== restriction)
		);
	}

	async function saveRestrictions() {
		try {
			await updateAllergies.mutateAsync({
				allergies: draftRestrictions.length
					? draftRestrictions.join(", ")
					: null
			});
			setDietaryRestrictions(draftRestrictions);
			setDialogMode(null);
			toast.success("Dietary restrictions updated");
		} catch {
			toast.error("Unable to update dietary restrictions");
		}
	}

	function discardChanges() {
		setDraftRestrictions(dietaryRestrictions);
		setDialogMode(null);
		toast("Changes to dietary restrictions discarded");
	}

	return (
		<section className="flex flex-col gap-4">
			<h2 className="font-medium text-dark-grey text-lg">
				Dietary Restrictions
			</h2>

			<Card size="sm">
				<CardHeader>
					<CardTitle>Your registered dietary restrictions:</CardTitle>
					<CardAction>
						<Button onClick={openEditor} size="sm" variant="ghost">
							Edit
							<Edit2Line data-icon="inline-end" />
						</Button>
					</CardAction>
				</CardHeader>
				<CardContent>
					{dietaryRestrictions.length > 0 ? (
						<div className="flex flex-wrap gap-2">
							{dietaryRestrictions.map((restriction) => (
								<Badge key={restriction} variant="accent">
									{restriction}
								</Badge>
							))}
						</div>
					) : (
						<p className="text-muted-foreground text-sm">None registered</p>
					)}
				</CardContent>
			</Card>

			<Dialog onOpenChange={handleDialogOpenChange} open={dialogMode !== null}>
				{dialogMode === "edit" ? (
					<DialogContent className="max-w-xs gap-5 p-7">
						<DialogHeader className="gap-2 pr-6">
							<DialogTitle className="font-semibold text-lg leading-tight">
								Edit your dietary restrictions
							</DialogTitle>
							<DialogDescription className="font-normal text-xs">
								Update your dietary restrictions so we can accommodate your
								needs!
							</DialogDescription>
						</DialogHeader>

						<form
							className="flex flex-col gap-5"
							onSubmit={(event) => {
								event.preventDefault();
								void saveRestrictions();
							}}
						>
							<FieldGroup className="gap-4">
								<FieldSet>
									<FieldLegend className="font-normal text-xs" variant="label">
										Your registered dietary restrictions:
									</FieldLegend>
									<Field>
										<div className="flex min-h-5 flex-wrap gap-2">
											{draftRestrictions.length > 0 ? (
												draftRestrictions.map((restriction) => (
													<Badge
														aria-label={`Remove ${restriction}`}
														className="cursor-pointer"
														key={restriction}
														onClick={() => removeRestriction(restriction)}
														render={<button type="button" />}
														variant="accent"
													>
														{restriction}
														<CloseLine data-icon="inline-end" />
													</Badge>
												))
											) : (
												<span className="text-muted-foreground text-xs">
													None selected
												</span>
											)}
										</div>
									</Field>
								</FieldSet>

								<FieldSet>
									<FieldLegend className="font-normal text-xs" variant="label">
										Add a restriction:
									</FieldLegend>
									<Field>
										<div className="flex flex-wrap gap-2">
											{availableRestrictions.length > 0 ? (
												availableRestrictions.map((restriction) => (
													<Button
														key={restriction}
														onClick={() => addRestriction(restriction)}
														size="xs"
														type="button"
														variant="outline"
													>
														{restriction}
														<AddLine data-icon="inline-end" />
													</Button>
												))
											) : (
												<span className="text-muted-foreground text-xs">
													All options selected
												</span>
											)}
										</div>
									</Field>
								</FieldSet>
							</FieldGroup>

							<DialogFooter className="mx-0 mb-0 flex-col border-0 bg-transparent p-0 sm:flex-col">
								<Button
									disabled={updateAllergies.isPending || !hasUnsavedChanges}
									size="xs"
									type="submit"
								>
									{updateAllergies.isPending ? "Saving..." : "Save changes"}
								</Button>
								<Button
									disabled={updateAllergies.isPending}
									onClick={requestEditorClose}
									size="xs"
									type="button"
									variant="outline"
								>
									Cancel
								</Button>
							</DialogFooter>
						</form>
					</DialogContent>
				) : dialogMode === "discard" ? (
					<DialogContent className="max-w-xs gap-5 p-7">
						<DialogHeader className="gap-2 pr-6">
							<DialogTitle className="font-semibold text-lg leading-tight">
								Are you sure you want to discard your changes?
							</DialogTitle>
							<DialogDescription className="font-normal text-xs">
								You’ve made edits to your dietary restrictions without saving.
							</DialogDescription>
						</DialogHeader>
						<DialogFooter className="mx-0 mb-0 flex-col border-0 bg-transparent p-0 sm:flex-col">
							<Button
								onClick={discardChanges}
								size="xs"
								variant="destructive-solid"
							>
								Yes, discard changes
							</Button>
							<Button
								onClick={() => setDialogMode("edit")}
								size="xs"
								variant="outline"
							>
								No, review changes
							</Button>
						</DialogFooter>
					</DialogContent>
				) : null}
			</Dialog>
		</section>
	);
}
