"use client";

/**
 * Shown after a team is created via the inline register modal. Reveals the
 * generated Team ID (formatted hyphenated, e.g. `A-B-C-1-2-3`) that the owner
 * must share so teammates can join. Replaces the old `/team/register/success`
 * page for the logged-in flow.
 */

import Image from "next/image";
import { Modal, ModalTitle, PrimaryButton } from "./Modal";

function formatTeamId(teamCode: string): string {
	return teamCode.toUpperCase().split("").join("-");
}

export default function RegisteredSuccessModal({
	open,
	onFinish,
	teamName,
	teamCode
}: {
	open: boolean;
	onFinish: () => void;
	teamName: string;
	teamCode: string;
}) {
	return (
		<Modal onClose={onFinish} open={open} showClose={false}>
			<div className="flex flex-col gap-2">
				<ModalTitle>{teamName} is registered!</ModalTitle>
				<p className="text-[16px] text-grey-600 leading-6">
					Share your Team ID with your teammates. Each member must enter it
					under
					<strong> Join Existing Team</strong> to officially join.
				</p>
			</div>

			<div className="flex justify-center py-2">
				<Image
					alt="Team registered"
					height={160}
					src="/team/mascot-flag.png"
					width={160}
				/>
			</div>

			<div className="flex flex-col items-center gap-1 rounded-xl bg-purple-50 py-4">
				<p className="font-medium text-[14px] text-grey-600">Your Team ID</p>
				<p className="font-semibold text-[28px] text-grey-800 leading-9 tracking-[0.1em]">
					{formatTeamId(teamCode)}
				</p>
			</div>

			<PrimaryButton onClick={onFinish} type="button">
				Finish
			</PrimaryButton>
		</Modal>
	);
}
