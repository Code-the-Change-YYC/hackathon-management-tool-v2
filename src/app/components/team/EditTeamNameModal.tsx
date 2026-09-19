"use client";

import { Input } from "@/app/components/ui/input";
import {
	ErrorText,
	Modal,
	ModalHeader,
	PrimaryButton,
	SecondaryButton,
	useNameField
} from "./Modal";

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
		<Modal onClose={onClose} open={open}>
			<ModalHeader
				description="Choose a new name for your team."
				title="Edit team name"
			/>

			<Input
				aria-label="Team name"
				className="h-auto rounded-xl px-4 py-3 font-medium text-[16px]"
				maxLength={50}
				onChange={(e) => setName(e.target.value)}
				value={name}
			/>

			{error && <ErrorText>{error}</ErrorText>}

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
