"use client";

import { DangerButton, Modal, SecondaryButton } from "./Modal";

export default function LeaveTeamModal({
	open,
	onConfirm,
	onCancel,
	teamName,
	loading
}: {
	open: boolean;
	onConfirm: () => void;
	onCancel: () => void;
	teamName: string;
	loading?: boolean;
}) {
	return (
		<Modal onClose={onCancel} open={open} showClose={false}>
			<div className="flex flex-col gap-2">
				<h2 className="font-semibold text-[28px] text-grey-800 leading-9">
					Are you sure you want to leave {teamName}?
				</h2>
				<p className="text-[16px] text-grey-600 leading-6">
					This action can't be undone!
				</p>
			</div>

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
