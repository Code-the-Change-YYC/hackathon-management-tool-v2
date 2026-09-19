"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle
} from "@/app/components/ui/alert-dialog";
import { Button } from "../../ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle
} from "../../ui/dialog";
import { Textarea } from "../../ui/textarea";
import type { Team } from "./types";

type Step = "intro" | "pass-fail" | "result" | "already-screened";

type PrescreenFields = {
	passed: boolean | null;
	justification: string;
};

type PrescreenDialogProps = {
	team: Team | null;
	onOpenChange: (open: boolean) => void;
};

function toPrescreenFields(team: Team): PrescreenFields {
	return {
		passed: team.prescreen,
		justification: team.feedback ?? ""
	};
}

export function PrescreenDialog({ team, onOpenChange }: PrescreenDialogProps) {
	const [step, setStep] = useState<Step>("intro");
	const [fields, setFields] = useState<PrescreenFields | null>(null);
	const [confirmingDiscard, setConfirmingDiscard] = useState(false);

	useEffect(() => {
		if (!team) {
			setFields(null);
			setStep("intro");
			return;
		}

		setFields(toPrescreenFields(team));
		setStep(team.prescreen === null ? "intro" : "already-screened");
	}, [team]);

	if (!(team && fields)) {
		return null;
	}

	const original = toPrescreenFields(team);
	const isDirty =
		fields.passed !== original.passed ||
		fields.justification !== original.justification;

	const hasJustification = fields.justification.trim().length > 0;

	function updateField<K extends keyof PrescreenFields>(
		key: K,
		value: PrescreenFields[K]
	) {
		setFields((current) => (current ? { ...current, [key]: value } : current));
	}

	function requestClose(nextOpen: boolean) {
		if (!nextOpen && isDirty) {
			setConfirmingDiscard(true);
			return;
		}
		onOpenChange(nextOpen);
	}

	function discardChanges() {
		setConfirmingDiscard(false);
		toast.success("Changes discarded!");
		onOpenChange(false);
	}

	function saveChanges() {
		// TODO: persist through the users router.
		toast.success("Changes saved!");
		onOpenChange(false);
	}

	function handleDecision(passed: boolean) {
		updateField("passed", passed);
		saveChanges();
	}

	return (
		<>
			<Dialog onOpenChange={requestClose} open={team !== null}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle className="text-lg">
							Prescreening for Team: {team.name}
						</DialogTitle>
					</DialogHeader>

					{step === "intro" && (
						<>
							<div className="flex flex-col gap-2">
								<p>Complete the prescreening check for team {team.name}!</p>
							</div>

							<div className="flex flex-col gap-2">
								<Button
									render={
										<Link href="/admin/teams/score-by-rubric">
											Score by Rubric
										</Link>
									}
								/>

								<Button onClick={() => setStep("pass-fail")} variant="ghost">
									Skip to pass/fail
								</Button>
							</div>
						</>
					)}

					{step === "pass-fail" && (
						<>
							<p>
								Please pass or fail the team, and give a brief justification*.
							</p>
							<Textarea
								onChange={(event) =>
									updateField("justification", event.target.value)
								}
								placeholder="Describe why the team passed or failed…"
								value={fields.justification}
							/>
							<div className="flex flex-col gap-2">
								<Button
									disabled={!hasJustification}
									onClick={() => void handleDecision(true)}
								>
									Pass team
								</Button>

								<Button
									disabled={!hasJustification}
									onClick={() => void handleDecision(false)}
									variant="ghost"
								>
									Fail team
								</Button>
							</div>
						</>
					)}

					{step === "result" && (
						// TODO: Add graphic
						<>
							<div className="flex flex-col gap-2">
								<p>
									You {fields.passed ? "passed" : "failed"} Team: {team.name}.
								</p>
							</div>

							<div className="flex flex-col gap-2">
								<Button onClick={() => requestClose(false)}>Finish</Button>
							</div>
						</>
					)}

					{step === "already-screened" && (
						<>
							<p>This team has already been prescreened!</p>
							{/* TODO: Add graphic */}
							<div className="flex flex-col gap-2">
								<Button
									onClick={() => setStep("pass-fail")}
									variant="destructive"
								>
									Edit result
								</Button>

								<Button onClick={() => requestClose(false)} variant="ghost">
									Cancel
								</Button>
							</div>
						</>
					)}
				</DialogContent>
			</Dialog>

			<AlertDialog onOpenChange={setConfirmingDiscard} open={confirmingDiscard}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>
							Are you sure you want to discard your changes?
						</AlertDialogTitle>
						<AlertDialogDescription>
							You&apos;ve made edits to {team.name}&apos;s feedback without
							saving.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter className="flex-col-reverse sm:flex-col-reverse">
						<AlertDialogCancel>No, review changes</AlertDialogCancel>
						<AlertDialogAction
							onClick={discardChanges}
							variant="destructive-solid"
						>
							Yes, discard changes
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}
