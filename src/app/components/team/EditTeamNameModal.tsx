"use client";

import { useEffect, useState } from "react";
import { Button } from "@/app/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle
} from "@/app/components/ui/dialog";
import { Input } from "@/app/components/ui/input";

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
	const [name, setName] = useState(currentName);
	const trimmed = name.trim();

	useEffect(() => {
		if (open) setName(currentName);
	}, [open, currentName]);

	return (
		<Dialog onOpenChange={(next) => !next && onClose()} open={open}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Edit team name</DialogTitle>
					<DialogDescription>
						Choose a new name for your team.
					</DialogDescription>
				</DialogHeader>

				<Input
					aria-label="Team name"
					className="h-auto rounded-xl px-4 py-3 font-medium text-[16px]"
					maxLength={50}
					onChange={(e) => setName(e.target.value)}
					value={name}
				/>

				{error && <p className="font-medium text-red-700 text-sm">{error}</p>}

				<DialogFooter>
					<Button
						disabled={!trimmed || loading}
						onClick={() => onSave(trimmed)}
						type="button"
					>
						{loading ? "Saving..." : "Save"}
					</Button>
					<Button onClick={onClose} type="button" variant="outline">
						Cancel
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
