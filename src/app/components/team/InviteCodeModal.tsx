"use client";

import Image from "next/image";
import { useState } from "react";
import { Modal, primaryButtonClass } from "./Modal";

export default function InviteCodeModal({
	open,
	onClose,
	code
}: {
	open: boolean;
	onClose: () => void;
	code: string;
}) {
	const [copied, setCopied] = useState(false);
	const cells = code.split("").map((char, index) => ({
		id: `cell-${index}`,
		char
	}));

	async function copy() {
		try {
			await navigator.clipboard.writeText(code);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch {
			setCopied(false);
		}
	}

	return (
		<Modal onClose={onClose} open={open}>
			<div className="flex flex-col gap-2">
				<h2 className="font-semibold text-[28px] text-grey-800 leading-9">
					Invite others to join your team!
				</h2>
				<p className="text-[16px] text-grey-600 leading-6">
					Share this code with your teammates so they can join your team!
				</p>
			</div>

			<div className="flex justify-center py-2">
				<Image
					alt="Mascot holding a flag"
					height={180}
					src="/team/mascot-register.png"
					width={180}
				/>
			</div>

			<div className="flex justify-center gap-2 sm:gap-3">
				{cells.map((cell) => (
					<span
						className="grid size-12 place-items-center rounded-xl border border-grey-300 bg-grey-00 font-medium text-[20px] text-grey-800 sm:size-14"
						key={cell.id}
					>
						{cell.char}
					</span>
				))}
			</div>

			<button className={primaryButtonClass} onClick={copy} type="button">
				{copied ? "Copied!" : "Copy code to clipboard"}
			</button>
		</Modal>
	);
}
