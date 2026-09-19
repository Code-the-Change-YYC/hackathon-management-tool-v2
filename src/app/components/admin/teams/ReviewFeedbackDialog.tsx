import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle
} from "@/app/components/ui/alert-dialog";
import { Button } from "@/app/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle
} from "@/app/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/app/components/ui/field";
import { Input } from "@/app/components/ui/input";
import { Label } from "../../ui/label";
import { RadioGroup, RadioGroupItem } from "../../ui/radio-group";
import type { Team } from "./types";

type EditableFields = {
	prescreen: boolean | null;
	prescreenFeedback: string;
	round1: boolean | null;
	round2: "winner" | "sp-winner" | "rejected" | null;
};

type ReviewFeedbackDialogProps = {
	team: Team | null;
	onOpenChange: (open: boolean) => void;
};

function toEditableFields(team: Team): EditableFields {
	return {
		prescreen: team.prescreen,
		prescreenFeedback: team.feedback ?? "",
		round1: team.round1,
		round2: team.round2
	};
}

function booleanToRadioValue(value: boolean | null) {
	if (value === true) {
		return "pass";
	}

	if (value === false) {
		return "fail";
	}

	return "";
}

function radioValueToBoolean(value: string): boolean | null {
	if (value === "pass") {
		return true;
	}

	if (value === "fail") {
		return false;
	}

	return null;
}

export function ReviewFeedbackDialog({
	team,
	onOpenChange
}: ReviewFeedbackDialogProps) {
	const [fields, setFields] = useState<EditableFields | null>(null);
	const [confirmingDiscard, setConfirmingDiscard] = useState(false);

	useEffect(() => {
		setFields(team ? toEditableFields(team) : null);
	}, [team]);

	if (!(team && fields)) {
		return null;
	}

	const original = toEditableFields(team);
	const isDirty =
		fields.prescreen !== original.prescreen ||
		fields.prescreenFeedback !== original.prescreenFeedback ||
		fields.round1 !== original.round1 ||
		fields.round2 !== original.round2;

	function updateField<K extends keyof EditableFields>(
		key: K,
		value: EditableFields[K]
	) {
		setFields((current) => (current ? { ...current, [key]: value } : current));
	}

	function requestClose(nextOpen: boolean) {
		if (!nextOpen && isDirty) {
			setConfirmingDiscard(true);
			return;
		}
		onOpenChange(nextOpen);
	}

	function discardChanges() {
		setConfirmingDiscard(false);
		toast.success("Changes discarded!");
		onOpenChange(false);
	}

	function saveChanges() {
		// TODO: persist through the teams router.
		toast.success("Changes saved!");
		onOpenChange(false);
	}

	return (
		<>
			<Dialog onOpenChange={requestClose} open={!confirmingDiscard}>
				<DialogContent className="sm:max-w-sm">
					<DialogHeader>
						<DialogTitle className="text-lg">
							Review Judging Feedback
						</DialogTitle>
					</DialogHeader>
					<FieldGroup>
						<Field>
							<FieldLabel
								htmlFor="review-prescreen-status"
								id="review-prescreen-status-label"
							>
								Prescreening
							</FieldLabel>
							<RadioGroup
								aria-labelledby="review-prescreen-status-label"
								id="review-prescreen-status"
								onValueChange={(value) =>
									updateField("prescreen", radioValueToBoolean(value))
								}
								value={booleanToRadioValue(fields.prescreen)}
							>
								<div className="flex items-center gap-2">
									<RadioGroupItem id="review-prescreen-pass" value="pass" />
									<Label htmlFor="review-prescreen-pass">Pass</Label>
								</div>
								<div className="flex items-center gap-2">
									<RadioGroupItem id="review-prescreen-fail" value="fail" />
									<Label htmlFor="review-prescreen-fail">Fail</Label>
								</div>
							</RadioGroup>
							<FieldLabel htmlFor="review-prescreen-feedback">
								Prescreen feedback
							</FieldLabel>
							<Input
								id="review-prescreen-feedback"
								onChange={(event) =>
									updateField("prescreenFeedback", event.target.value)
								}
								value={fields.prescreenFeedback}
							/>
						</Field>

						<Field>
							<FieldLabel
								htmlFor="review-round1-status"
								id="review-round1-status-label"
							>
								Round 1
							</FieldLabel>
							<RadioGroup
								aria-labelledby="review-round1-status-label"
								id="review-round1-status"
								onValueChange={(value) =>
									updateField("round1", radioValueToBoolean(value))
								}
								value={booleanToRadioValue(fields.round1)}
							>
								<div className="flex items-center gap-2">
									<RadioGroupItem id="review-round1-pass" value="pass" />
									<Label htmlFor="review-round1-pass">Pass</Label>
								</div>
								<div className="flex items-center gap-2">
									<RadioGroupItem id="review-round1-fail" value="fail" />
									<Label htmlFor="review-round1-fail">Fail</Label>
								</div>
							</RadioGroup>
						</Field>

						<Field>
							<FieldLabel
								htmlFor="review-round2-status"
								id="review-round2-status-label"
							>
								Round 2
							</FieldLabel>
							<RadioGroup
								aria-labelledby="review-round2-status-label"
								id="review-round2-status"
								onValueChange={(value) => updateField("round2", value)}
								value={fields.round2}
							>
								<div className="flex items-center gap-2">
									<RadioGroupItem id="review-round2-winner" value="winner" />
									<Label htmlFor="review-round2-winner">Winner</Label>
								</div>
								<div className="flex items-center gap-2">
									<RadioGroupItem
										id="review-round2-sp-winner"
										value="sp-winner"
									/>
									<Label htmlFor="review-round2-sp-winner">SP Winner</Label>
								</div>
								<div className="flex items-center gap-2">
									<RadioGroupItem
										id="review-round2-rejected"
										value="rejected"
									/>
									<Label htmlFor="review-round2-rejected">None</Label>
								</div>
							</RadioGroup>
						</Field>
					</FieldGroup>
					<div className="flex flex-col gap-2">
						<Button disabled={!isDirty} onClick={saveChanges}>
							Save changes
						</Button>
						<Button onClick={() => requestClose(false)} variant="ghost">
							Cancel
						</Button>
					</div>
				</DialogContent>
			</Dialog>

			<AlertDialog onOpenChange={setConfirmingDiscard} open={confirmingDiscard}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>
							Are you sure you want to discard your changes?
						</AlertDialogTitle>
						<AlertDialogDescription>
							You&apos;ve made edits to {team.name}&apos;s judging feedback
							without saving.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter className="flex-col-reverse sm:flex-col-reverse">
						<AlertDialogCancel>No, review changes</AlertDialogCancel>
						<AlertDialogAction
							onClick={discardChanges}
							variant="destructive-solid"
						>
							Yes, discard changes
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}
