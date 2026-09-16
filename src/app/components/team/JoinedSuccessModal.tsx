"use client";

import Image from "next/image";
import { Modal, ModalTitle, PrimaryButton } from "./Modal";

export default function JoinedSuccessModal({
	open,
	onFinish,
	teamName
}: {
	open: boolean;
	onFinish: () => void;
	teamName: string;
}) {
	return (
		<Modal onClose={onFinish} open={open} showClose={false}>
			<div className="flex flex-col gap-2">
				<ModalTitle>You've joined {teamName}!</ModalTitle>
				<p className="text-[16px] text-grey-600 leading-6">
					Congrats! You've joined your teammates at {teamName} as a registered
					member!
				</p>
			</div>

			<div className="flex justify-center py-2">
				<Image
					alt="Teammates celebrating"
					height={180}
					src="/team/mascot-celebrate.png"
					width={180}
				/>
			</div>

			<PrimaryButton onClick={onFinish} type="button">
				Finish
			</PrimaryButton>
		</Modal>
	);
}
