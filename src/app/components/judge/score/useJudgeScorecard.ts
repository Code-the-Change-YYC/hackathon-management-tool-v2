"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { api } from "@/trpc/react";
import {
	type Criterion,
	isScorecardComplete,
	type JudgeAssignment
} from "../judgePortal";
import { useJudgeScoreDraft } from "./useJudgeScoreDraft";

export type Scorecard = ReturnType<typeof useJudgeScorecard>;

export function useJudgeScorecard(
	assignment: JudgeAssignment,
	criteria: Criterion[],
	userId: string
) {
	const router = useRouter();
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
	const [status, setStatus] = useState<"editing" | "saving">("editing");
	const [error, setError] = useState("");
	const saving = useRef(false);
	const complete =
		criteria.length > 0 && isScorecardComplete(criteria, draft.scores);
	const submit = async () => {
		if (!complete || !draft.initialized || saving.current) return;
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
		toast.success(`Scores submitted for ${assignment.team.name}`);
		// Stay in the saving state while leaving so the scorecard can't be resubmitted.
		router.push("/judge");
	};
	return { ...draft, complete, status, error, submit };
}
