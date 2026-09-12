"use client";

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
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue
} from "@/app/components/ui/select";
import type { Role } from "@/types/types";
import type { Participant } from "./types";
import { ROLE_OPTIONS } from "./types";

type EditableFields = {
	firstName: string;
	lastName: string;
	email: string;
	role: Role;
};

type EditParticipantDialogProps = {
	participant: Participant | null;
	onOpenChange: (open: boolean) => void;
};

function toEditableFields(participant: Participant): EditableFields {
	return {
		firstName: participant.firstName,
		lastName: participant.lastName,
		email: participant.email,
		role: participant.role
	};
}

export function EditParticipantDialog({
	participant,
	onOpenChange
}: EditParticipantDialogProps) {
	const [fields, setFields] = useState<EditableFields | null>(null);
	const [confirmingDiscard, setConfirmingDiscard] = useState(false);

	useEffect(() => {
		setFields(participant ? toEditableFields(participant) : null);
	}, [participant]);

	if (!(participant && fields)) {
		return null;
	}

	const original = toEditableFields(participant);
	const isDirty =
		fields.firstName !== original.firstName ||
		fields.lastName !== original.lastName ||
		fields.email !== original.email ||
		fields.role !== original.role;

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
		// TODO: persist through the users router.
		toast.success("Changes saved!");
		onOpenChange(false);
	}

	return (
		<>
			<Dialog onOpenChange={requestClose} open={!confirmingDiscard}>
				<DialogContent className="sm:max-w-sm">
					<DialogHeader>
						<DialogTitle className="text-lg">Edit user information</DialogTitle>
					</DialogHeader>
					<FieldGroup>
						<Field>
							<FieldLabel htmlFor="edit-first-name">First Name</FieldLabel>
							<Input
								id="edit-first-name"
								onChange={(event) =>
									updateField("firstName", event.target.value)
								}
								value={fields.firstName}
							/>
						</Field>
						<Field>
							<FieldLabel htmlFor="edit-last-name">Last Name</FieldLabel>
							<Input
								id="edit-last-name"
								onChange={(event) =>
									updateField("lastName", event.target.value)
								}
								value={fields.lastName}
							/>
						</Field>
						<Field>
							<FieldLabel htmlFor="edit-email">Email Address</FieldLabel>
							<Input
								id="edit-email"
								onChange={(event) => updateField("email", event.target.value)}
								type="email"
								value={fields.email}
							/>
						</Field>
						<Field>
							<FieldLabel htmlFor="edit-role">User Role</FieldLabel>
							<Select
								items={ROLE_OPTIONS}
								onValueChange={(value) => updateField("role", value as Role)}
								value={fields.role}
							>
								<SelectTrigger className="w-full" id="edit-role">
									<SelectValue placeholder="User role" />
								</SelectTrigger>
								<SelectContent>
									<SelectGroup>
										{ROLE_OPTIONS.map((option) => (
											<SelectItem key={option.value} value={option.value}>
												{option.label}
											</SelectItem>
										))}
									</SelectGroup>
								</SelectContent>
							</Select>
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
							You&apos;ve made edits to {participant.firstName}&apos;s profile
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
