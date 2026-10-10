"use client";

import Image from "next/image";
import { TeamCodeDisplay } from "@/app/components/onboarding/TeamCodeDisplay";
import { Button } from "@/app/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle
} from "@/app/components/ui/dialog";

export default function InviteCodeModal({
	open,
	onClose,
	code
}: {
	open: boolean;
	onClose: () => void;
	code: string;
}) {
	return (
		<Dialog onOpenChange={(next) => !next && onClose()} open={open}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Invite others to join your team!</DialogTitle>
					<DialogDescription>
						Share this code with your teammates so they can join your team.
					</DialogDescription>
				</DialogHeader>
				<div className="flex justify-center">
					<Image
						alt="Mascot holding a flag"
						height={180}
						src="/team/mascot-flag.png"
						width={180}
					/>
				</div>
				<TeamCodeDisplay code={code} />
				<DialogFooter>
					<Button onClick={onClose} type="button">
						Done
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
