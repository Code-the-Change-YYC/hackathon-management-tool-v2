"use client";

import { ActionModal } from "./Modal";

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
		<ActionModal
			danger
			description="This action can't be undone!"
			error={error}
			onClose={onCancel}
			open={open}
			primary={{
				label: "Yes, leave team",
				loadingLabel: "Leaving...",
				loading,
				onClick: onConfirm
			}}
			secondary={{ label: "Cancel", onClick: onCancel }}
			showClose={false}
			title={`Are you sure you want to leave ${teamName}?`}
		/>
	);
}
