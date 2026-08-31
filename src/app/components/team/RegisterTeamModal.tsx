"use client";

// Inline team-registration modal for the "I have a team but it's not
// registered yet" path on /participant/my-team.

import { useEffect, useState } from "react";
import { Input } from "@/app/components/ui/input";
import { Modal, ModalTitle, PrimaryButton, SecondaryButton } from "./Modal";
import { isValidTeamName, TEAM_NAME_MAX } from "./teamName";

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

	useEffect(() => {
		if (open) {
			setName("");
		}
	}, [open]);

	const trimmed = name.trim();
	const isValid = isValidTeamName(name);

	return (
		<Modal onClose={onClose} open={open}>
			<div className="flex flex-col gap-2">
				<ModalTitle>Register your team</ModalTitle>
				<p className="text-[16px] text-grey-600 leading-6">
					Pick a name for your team. You'll get a Team ID to share with your
					teammates so they can join.
				</p>
			</div>

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

			{error && <p className="font-medium text-[14px] text-red-700">{error}</p>}

			<div className="flex flex-col gap-3">
				<PrimaryButton
					disabled={!isValid || loading}
					onClick={() => isValid && onSubmit(trimmed)}
					type="button"
				>
					{loading ? "Registering..." : "Register"}
				</PrimaryButton>
				<SecondaryButton onClick={onClose} type="button">
					Go back
				</SecondaryButton>
			</div>
		</Modal>
	);
}
