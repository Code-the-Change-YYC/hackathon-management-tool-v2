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
import { isValidTeamName, TEAM_NAME_MAX } from "@/lib/utils";

export default function RegisterTeamModal({
	open,
	onClose,
	onSubmit,
	loading,
	error
}: {
	open: boolean;
	onClose: () => void;
	onSubmit: (name: string) => void;
	loading?: boolean;
	error?: string | null;
}) {
	const [name, setName] = useState("");
	const trimmed = name.trim();
	const isValid = isValidTeamName(name);

	useEffect(() => {
		if (open) setName("");
	}, [open]);

	return (
		<Dialog onOpenChange={(next) => !next && onClose()} open={open}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Register your team</DialogTitle>
					<DialogDescription>
						Pick a name for your team. You'll get a Team ID to share with your
						teammates so they can join.
					</DialogDescription>
				</DialogHeader>

				<div className="flex flex-col gap-1.5">
					<Input
						aria-label="Team name"
						className="h-auto rounded-xl px-4 py-3 font-medium text-[16px]"
						maxLength={TEAM_NAME_MAX}
						onChange={(e) => setName(e.target.value)}
						placeholder="Team Name"
						value={name}
					/>
					<p className="font-medium text-[13px] text-grey-600 leading-5">
						Letters, numbers, spaces, hyphens, and underscores only (max 50
						chars).
					</p>
				</div>

				{error && <p className="font-medium text-red-700 text-sm">{error}</p>}

				<DialogFooter>
					<Button
						disabled={!isValid || loading}
						onClick={() => isValid && onSubmit(trimmed)}
						type="button"
					>
						{loading ? "Registering..." : "Register"}
					</Button>
					<Button onClick={onClose} type="button" variant="outline">
						Go back
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
