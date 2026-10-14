"use client";

import { Button } from "@/app/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle
} from "@/app/components/ui/dialog";

export default function LeaveTeamModal({
	open,
	onConfirm,
	onCancel,
	teamName,
	description,
	loading,
	error
}: {
	open: boolean;
	onConfirm: () => void;
	onCancel: () => void;
	teamName: string;
	description: string;
	loading?: boolean;
	error?: string | null;
}) {
	return (
		<Dialog onOpenChange={(next) => !next && onCancel()} open={open}>
			<DialogContent showCloseButton={false}>
				<DialogHeader>
					<DialogTitle>Are you sure you want to leave {teamName}?</DialogTitle>
					<DialogDescription>{description}</DialogDescription>
				</DialogHeader>

				{error && <p className="font-medium text-red-700 text-sm">{error}</p>}

				<DialogFooter>
					<Button
						disabled={loading}
						onClick={onConfirm}
						type="button"
						variant="destructive-solid"
					>
						{loading ? "Leaving..." : "Yes, leave team"}
					</Button>
					<Button onClick={onCancel} type="button" variant="outline">
						Cancel
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
