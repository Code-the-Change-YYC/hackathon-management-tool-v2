"use client";

import Image from "next/image";
import { Modal, primaryButtonClass } from "./Modal";

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
				<h2 className="font-semibold text-[28px] text-grey-800 leading-9">
					You've joined {teamName}!
				</h2>
				<p className="text-[16px] text-grey-600 leading-6">
					Congrats! You've joined your teammates at {teamName} as a registered
					member!
				</p>
			</div>

			<div className="flex justify-center py-2">
				<Image
					alt="Teammates celebrating"
					height={180}
					src="/team/mascot-join.png"
					width={180}
				/>
			</div>

			<button className={primaryButtonClass} onClick={onFinish} type="button">
				Finish
			</button>
		</Modal>
	);
}
