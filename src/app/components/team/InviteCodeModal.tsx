"use client";

import Image from "next/image";
import { useCopy } from "@/hooks/use-copy";
import { Modal, ModalHeader, PrimaryButton } from "./Modal";

export default function InviteCodeModal({
	open,
	onClose,
	code
}: {
	open: boolean;
	onClose: () => void;
	code: string;
}) {
	const { copied, copy } = useCopy();
	const cells = code.split("").map((char, index) => ({
		id: `cell-${index}`,
		char
	}));

	return (
		<Modal onClose={onClose} open={open}>
			<ModalHeader
				description="Share this code with your teammates so they can join your team!"
				title="Invite others to join your team!"
			/>

			<div className="flex justify-center py-2">
				<Image
					alt="Mascot holding a flag"
					height={180}
					src="/team/mascot-flag.png"
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

			<PrimaryButton onClick={() => copy(code)} type="button">
				{copied ? "Copied!" : "Copy code to clipboard"}
			</PrimaryButton>
		</Modal>
	);
}
