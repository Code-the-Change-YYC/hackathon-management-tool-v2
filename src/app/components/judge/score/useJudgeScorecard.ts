"use client";

import { useRef, useState } from "react";
import { useRefresh } from "@/hooks/use-refresh";
import { api } from "@/trpc/react";
import {
	type Criterion,
	isCriterionScoreValid,
	type JudgeAssignment
} from "../judgePortal";
import { useJudgeScoreDraft } from "./useJudgeScoreDraft";

export function useJudgeScorecard(
	assignment: JudgeAssignment,
	criteria: Criterion[],
	userId: string
) {
	const { refresh } = useRefresh();
	const mutation = api.scores.createMany.useMutation();
	// The protected server page supplies only this judge's persisted scores.
	// Avoid a second assignment-only client cache that could survive an account switch.
	const draft = useJudgeScoreDraft({
		userId,
		assignmentId: assignment.id,
		criteria,
		savedScores: assignment.scores,
		ready: true
	});
	const [status, setStatus] = useState<"editing" | "saving" | "saved">(
		"editing"
	);
	const [error, setError] = useState("");
	const saving = useRef(false);
	const complete =
		criteria.length > 0 &&
		criteria.every((criterion) =>
			isCriterionScoreValid(criterion, draft.scores[criterion.id])
		);
	const submit = async () => {
		if (!complete || !draft.initialized || saving.current || status === "saved")
			return;
		saving.current = true;
		setStatus("saving");
		setError("");
		try {
			await mutation.mutateAsync(
				criteria.map((criterion) => ({
					assignmentId: assignment.id,
					criteriaId: criterion.id,
					score: draft.scores[criterion.id] as number
				}))
			);
		} catch (cause) {
			setError(
				cause instanceof Error
					? cause.message
					: "Your scores could not be submitted. Please try again."
			);
			setStatus("editing");
			saving.current = false;
			return;
		}
		draft.clearDraft();
		setStatus("saved");
		saving.current = false;
		// A failed follow-up refresh cannot turn a persisted submission into a failed save.
		refresh();
	};
	return { ...draft, complete, status, error, submit };
}
