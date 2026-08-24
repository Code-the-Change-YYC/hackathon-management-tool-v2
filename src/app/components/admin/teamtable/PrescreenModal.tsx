"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/app/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle
} from "@/app/components/ui/dialog";
import { Field, FieldLabel } from "@/app/components/ui/field";
import { Textarea } from "@/app/components/ui/textarea";
import { api } from "@/trpc/react";

interface PrescreenModalProps {
	teamId: string;
	teamName: string;
	open: boolean;
	onClose: () => void;
}

export default function PrescreenModal({
	teamId,
	teamName,
	open,
	onClose
}: PrescreenModalProps) {
	const utils = api.useUtils();
	const [comments, setComments] = useState("");
	const setPrescreen = api.teams.setPrescreen.useMutation({
		onSuccess: async () => {
			await utils.teams.getAll.invalidate();
		}
	});

	const canSubmit = comments.trim().length > 0 && !setPrescreen.isPending;

	const handleSubmit = async (status: "passed" | "failed") => {
		try {
			await setPrescreen.mutateAsync({
				teamId,
				status,
				comments: comments.trim()
			});
			toast.success(
				status === "passed"
					? `Team ${teamName} passed prescreening.`
					: `Team ${teamName} failed prescreening.`
			);
			onClose();
		} catch (error) {
			console.error(error);
			toast.error("Failed to save prescreen result. Please try again.");
		}
	};

	return (
		<Dialog
			onOpenChange={(nextOpen) => {
				if (!nextOpen) onClose();
			}}
			open={open}
		>
			<DialogContent className="sm:max-w-2xl" showCloseButton>
				<DialogHeader>
					<DialogTitle>
						Prescreening for Team:{" "}
						<span className="text-primary">{teamName}</span>
					</DialogTitle>
					<DialogDescription>
						Please pass or fail the team, and give a brief justification based
						on rubric criteria.
					</DialogDescription>
				</DialogHeader>

				<Field>
					<FieldLabel htmlFor="prescreen-comments">Comments*</FieldLabel>
					<Textarea
						id="prescreen-comments"
						onChange={(e) => setComments(e.target.value)}
						placeholder="Describe why the team passed/failed..."
						rows={4}
						value={comments}
					/>
				</Field>

				<DialogFooter>
					<Button
						disabled={!canSubmit}
						onClick={() => void handleSubmit("passed")}
						type="button"
					>
						{setPrescreen.isPending ? "Saving..." : "Pass team"}
					</Button>
					<Button
						disabled={!canSubmit}
						onClick={() => void handleSubmit("failed")}
						type="button"
						variant="outline"
					>
						Fail team
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
