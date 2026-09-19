"use client";

import { Input } from "@/app/components/ui/input";
import { ActionModal, useNameField } from "./Modal";

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
	const [name, setName] = useNameField(open, currentName);
	const trimmed = name.trim();

	return (
		<ActionModal
			description="Choose a new name for your team."
			error={error}
			onClose={onClose}
			open={open}
			primary={{
				label: "Save",
				loadingLabel: "Saving...",
				loading,
				disabled: !trimmed,
				onClick: () => onSave(trimmed)
			}}
			secondary={{ label: "Cancel", onClick: onClose }}
			title="Edit team name"
		>
			<Input
				aria-label="Team name"
				className="h-auto rounded-xl px-4 py-3 font-medium text-[16px]"
				maxLength={50}
				onChange={(e) => setName(e.target.value)}
				value={name}
			/>
		</ActionModal>
	);
}
