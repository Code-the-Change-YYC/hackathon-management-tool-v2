"use client";

import { JoinTeamForm } from "@/app/components/onboarding/JoinTeamForm";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle
} from "@/app/components/ui/dialog";

export default function JoinCodeModal({
	open,
	onClose,
	onBack,
	onJoined
}: {
	open: boolean;
	onClose: () => void;
	onBack: () => void;
	onJoined: () => Promise<void> | void;
}) {
	return (
		<Dialog onOpenChange={(next) => !next && onClose()} open={open}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Enter your team’s invite code to join</DialogTitle>
					<DialogDescription>
						Ask whoever registered your team for its 6‑character invite code.
						They’ll find it under Invite on their “Team” page.
					</DialogDescription>
				</DialogHeader>
				<JoinTeamForm
					Actions={DialogFooter}
					onBack={onBack}
					onJoined={onJoined}
				/>
			</DialogContent>
		</Dialog>
	);
}
