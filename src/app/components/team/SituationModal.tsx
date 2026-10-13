"use client";

import {
	type Situation,
	TeamSituationForm
} from "@/app/components/onboarding/TeamSituationForm";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle
} from "@/app/components/ui/dialog";

export default function SituationModal({
	open,
	onClose,
	onContinue
}: {
	open: boolean;
	onClose: () => void;
	onContinue: (situation: Situation) => void;
}) {
	return (
		<Dialog onOpenChange={(next) => !next && onClose()} open={open}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Form your team</DialogTitle>
					<DialogDescription>
						Select the statement that describes your situation best.
					</DialogDescription>
				</DialogHeader>
				<TeamSituationForm Actions={DialogFooter} onContinue={onContinue} />
			</DialogContent>
		</Dialog>
	);
}
