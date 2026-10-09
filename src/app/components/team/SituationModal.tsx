"use client";

import { useState } from "react";
import { Button } from "@/app/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle
} from "@/app/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/app/components/ui/radio-group";

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
	const [selected, setSelected] = useState<Situation | "">("");

	return (
		<Dialog onOpenChange={(next) => !next && onClose()} open={open}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Form your team</DialogTitle>
					<DialogDescription>
						Select the statement that describes your situation best.
					</DialogDescription>
				</DialogHeader>

				<RadioGroup
					className="gap-3"
					onValueChange={(value) => setSelected(value as Situation)}
					value={selected}
				>
					{OPTIONS.map((option) => {
						const active = selected === option.value;
						return (
							<label
								className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 px-4 py-4 text-left transition ${
									active
										? "border-primary bg-purple-50"
										: "border-grey-300 bg-grey-00 hover:border-grey-400"
								}`}
								htmlFor={option.value}
								key={option.value}
							>
								<RadioGroupItem
									className="shrink-0"
									id={option.value}
									value={option.value}
								/>
								<span className="font-medium text-[14px] text-grey-800 leading-5">
									{option.label}
								</span>
							</label>
						);
					})}
				</RadioGroup>

				<DialogFooter>
					<Button
						disabled={!selected}
						onClick={() => selected && onContinue(selected)}
						type="button"
					>
						Continue
					</Button>
					<Button onClick={onClose} type="button" variant="outline">
						Go back
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
