"use client";

import { RegisterTeamForm } from "@/app/components/onboarding/RegisterTeamForm";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle
} from "@/app/components/ui/dialog";

export default function RegisterTeamModal({
	open,
	onClose,
	onBack,
	onRegistered
}: {
	open: boolean;
	onClose: () => void;
	onBack: () => void;
	onRegistered: () => Promise<void> | void;
}) {
	return (
		<Dialog onOpenChange={(next) => !next && onClose()} open={open}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Register your team</DialogTitle>
					<DialogDescription>
						Register your team so your teammates can join you.
					</DialogDescription>
				</DialogHeader>
				<RegisterTeamForm
					Actions={DialogFooter}
					onBack={onBack}
					onRegistered={onRegistered}
				/>
			</DialogContent>
		</Dialog>
	);
}
