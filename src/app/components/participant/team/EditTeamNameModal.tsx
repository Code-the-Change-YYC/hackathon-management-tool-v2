"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { TextField } from "@/app/components/forms/TextField";
import { Button } from "@/app/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle
} from "@/app/components/ui/dialog";
import { TEAM_NAME_MAX } from "@/lib/utils";
import {
	type RegisterTeamValues,
	registerTeamSchema
} from "@/lib/validation/team";

export default function EditTeamNameModal({
	open,
	onClose,
	currentName,
	onSave,
	loading,
	error
}: {
	open: boolean;
	onClose: () => void;
	currentName: string;
	onSave: (name: string) => void;
	loading?: boolean;
	error?: string | null;
}) {
	// Uses the same rules as registering a team.
	const form = useForm<RegisterTeamValues>({
		defaultValues: { name: currentName },
		resolver: zodResolver(registerTeamSchema)
	});

	useEffect(() => {
		if (open) form.reset({ name: currentName });
	}, [open, currentName, form]);

	useEffect(() => {
		if (error) form.setError("name", { message: error }, { shouldFocus: true });
	}, [error, form]);

	return (
		<Dialog onOpenChange={(next) => !next && onClose()} open={open}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Edit team name</DialogTitle>
					<DialogDescription>
						Choose a new name for your team.
					</DialogDescription>
				</DialogHeader>

				<form
					className="flex flex-col gap-6"
					noValidate
					onSubmit={form.handleSubmit(({ name }) => {
						if (name === currentName) return onClose();
						onSave(name);
					})}
				>
					<TextField
						autoComplete="off"
						control={form.control}
						disabled={loading}
						label="Team name"
						maxLength={TEAM_NAME_MAX}
						name="name"
					/>

					<DialogFooter>
						<Button disabled={loading} type="submit">
							{loading ? "Saving..." : "Save"}
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
