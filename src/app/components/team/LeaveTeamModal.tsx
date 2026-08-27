"use client";

// Confirmation modal for leaving the team.

import { DangerButton, Modal, ModalTitle, SecondaryButton } from "./Modal";

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
			<div className="flex flex-col gap-2">
				<ModalTitle>Are you sure you want to leave {teamName}?</ModalTitle>
				<p className="text-[16px] text-grey-600 leading-6">
					This action can't be undone!
				</p>
			</div>

			{error && <p className="font-medium text-[14px] text-red-700">{error}</p>}

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
