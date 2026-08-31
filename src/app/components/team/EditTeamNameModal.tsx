"use client";

// Modal for renaming the team (owner-only, gated by the caller).

import { useEffect, useState } from "react";
import { Input } from "@/app/components/ui/input";
import { Modal, ModalTitle, PrimaryButton, SecondaryButton } from "./Modal";

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

	useEffect(() => {
		if (open) {
			setName(currentName);
		}
	}, [open, currentName]);

	const trimmed = name.trim();

	return (
		<Modal onClose={onClose} open={open}>
			<div className="flex flex-col gap-2">
				<ModalTitle>Edit team name</ModalTitle>
				<p className="text-[16px] text-grey-600 leading-6">
					Choose a new name for your team.
				</p>
			</div>

			<Input
				aria-label="Team name"
				className="h-auto rounded-xl px-4 py-3 font-medium text-[16px]"
				maxLength={50}
				onChange={(e) => setName(e.target.value)}
				value={name}
			/>

			{error && <p className="font-medium text-[14px] text-red-700">{error}</p>}

			<div className="flex flex-col gap-3">
				<PrimaryButton
					disabled={!trimmed || loading}
					onClick={() => onSave(trimmed)}
					type="button"
				>
					{loading ? "Saving..." : "Save"}
				</PrimaryButton>
				<SecondaryButton onClick={onClose} type="button">
					Cancel
				</SecondaryButton>
			</div>
		</Modal>
	);
}
