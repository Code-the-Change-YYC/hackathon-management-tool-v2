"use client";

import { useEffect, useState } from "react";
import { Modal, primaryButtonClass, secondaryButtonClass } from "./Modal";

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
				<h2 className="font-semibold text-[28px] text-grey-800 leading-9">
					Edit team name
				</h2>
				<p className="text-[16px] text-grey-600 leading-6">
					Choose a new name for your team.
				</p>
			</div>

			<input
				aria-label="Team name"
				className="w-full rounded-xl border border-grey-300 bg-grey-00 px-4 py-3 font-medium text-[16px] text-grey-800 outline-none transition focus:border-purple-500"
				maxLength={50}
				onChange={(e) => setName(e.target.value)}
				value={name}
			/>

			{error && <p className="font-medium text-[14px] text-red-700">{error}</p>}

			<div className="flex flex-col gap-3">
				<button
					className={primaryButtonClass}
					disabled={!trimmed || loading}
					onClick={() => onSave(trimmed)}
					type="button"
				>
					{loading ? "Saving..." : "Save"}
				</button>
				<button
					className={secondaryButtonClass}
					onClick={onClose}
					type="button"
				>
					Cancel
				</button>
			</div>
		</Modal>
	);
}
