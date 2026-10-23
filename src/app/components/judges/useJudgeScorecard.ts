"use client";

import { useRef, useState } from "react";
import { api } from "@/trpc/react";
import { useJudgeUser } from "./JudgeUserProvider";
import type { Criterion, JudgeAssignment } from "./judgePortal";
import { useJudgeScoreDraft } from "./useJudgeScoreDraft";

export function useJudgeScorecard(
	assignment: JudgeAssignment,
	criteria: Criterion[]
) {
	const { userId } = useJudgeUser();
	const utils = api.useUtils();
	const scoresQuery = api.scores.getByAssignment.useQuery(
		{ assignmentId: assignment.id },
		{ refetchOnWindowFocus: false }
	);
	const mutation = api.scores.createMany.useMutation();
	const draft = useJudgeScoreDraft({
		userId,
		assignmentId: assignment.id,
		criteria,
		savedScores: scoresQuery.data ?? [],
		ready: scoresQuery.isSuccess
	});
	const [status, setStatus] = useState<"editing" | "saving" | "saved">(
		"editing"
	);
	const [error, setError] = useState("");
	const saving = useRef(false);
	const complete =
		criteria.length > 0 &&
		criteria.every((criterion) => Object.hasOwn(draft.scores, criterion.id));

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
		// Persistence succeeded; cache refresh errors must never look like a failed save.
		await Promise.allSettled([
			utils.scores.invalidate(),
			utils.judgingAssignments.getByJudge.invalidate({ judgeId: userId }),
			utils.teams.getRankings.invalidate()
		]);
		saving.current = false;
	};
	return { ...draft, complete, status, error, submit, scoresQuery };
}
