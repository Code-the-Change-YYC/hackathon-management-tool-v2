"use client";

import {
	DangerButton,
	ErrorText,
	Modal,
	ModalHeader,
	SecondaryButton
} from "./Modal";

export default function LeaveTeamModal({
	open,
	onConfirm,
	onCancel,
	teamName,
	loading,
	error
}: {
	open: boolean;
	onConfirm: () => void;
	onCancel: () => void;
	teamName: string;
	loading?: boolean;
	error?: string | null;
}) {
	return (
		<Modal onClose={onCancel} open={open} showClose={false}>
			<ModalHeader
				description="This action can't be undone!"
				title={`Are you sure you want to leave ${teamName}?`}
			/>

			{error && <ErrorText>{error}</ErrorText>}

			<div className="flex flex-col gap-3">
				<DangerButton disabled={loading} onClick={onConfirm} type="button">
					{loading ? "Leaving..." : "Yes, leave team"}
				</DangerButton>
				<SecondaryButton onClick={onCancel} type="button">
					Cancel
				</SecondaryButton>
			</div>
		</Modal>
	);
}
