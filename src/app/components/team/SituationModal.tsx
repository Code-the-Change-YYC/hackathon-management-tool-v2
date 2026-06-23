"use client";

import { useState } from "react";
import { Modal, primaryButtonClass, secondaryButtonClass } from "./Modal";

export type Situation = "registered" | "unregistered" | "no-team";

const OPTIONS: { value: Situation; label: string }[] = [
	{
		value: "registered",
		label:
			"I have a team of 2-5 members already, and our team is already registered in the system."
	},
	{
		value: "unregistered",
		label:
			"I have a team of 2-5 members already, but our team is not registered yet."
	},
	{ value: "no-team", label: "I don't have a team yet." }
];

export default function SituationModal({
	open,
	onClose,
	onContinue
}: {
	open: boolean;
	onClose: () => void;
	onContinue: (situation: Situation) => void;
}) {
	const [selected, setSelected] = useState<Situation | null>(null);

	return (
		<Modal onClose={onClose} open={open}>
			<h2 className="max-w-[90%] font-semibold text-[28px] text-grey-800 leading-9">
				Select the statement that describes your situation best:
			</h2>

			<div className="flex flex-col gap-3">
				{OPTIONS.map((option) => {
					const active = selected === option.value;
					return (
						<button
							className={`flex items-center gap-3 rounded-xl border-2 px-4 py-4 text-left transition ${
								active
									? "border-purple-500 bg-purple-50"
									: "border-grey-300 bg-grey-00 hover:border-grey-400"
							}`}
							key={option.value}
							onClick={() => setSelected(option.value)}
							type="button"
						>
							<span
								className={`grid size-5 shrink-0 place-items-center rounded-full border-2 ${
									active ? "border-purple-500" : "border-grey-400"
								}`}
							>
								{active && (
									<span className="size-2.5 rounded-full bg-purple-500" />
								)}
							</span>
							<span className="font-medium text-[14px] text-grey-800 leading-5">
								{option.label}
							</span>
						</button>
					);
				})}
			</div>

			<div className="flex flex-col gap-3">
				<button
					className={primaryButtonClass}
					disabled={!selected}
					onClick={() => selected && onContinue(selected)}
					type="button"
				>
					Continue
				</button>
				<button
					className={secondaryButtonClass}
					onClick={onClose}
					type="button"
				>
					Go back
				</button>
			</div>
		</Modal>
	);
}
