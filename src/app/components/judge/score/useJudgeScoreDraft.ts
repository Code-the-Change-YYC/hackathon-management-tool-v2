"use client";

import { useEffect, useState } from "react";
import { z } from "zod";
import type { Criterion } from "../judgePortal";

const draftSchema = z.object({
	version: z.literal(1),
	rubric: z.string(),
	baseline: z.string(),
	savedAt: z.number().int().nonnegative(),
	scores: z.record(z.number().int().nonnegative())
});
const MAX_DRAFT_AGE = 7 * 24 * 60 * 60 * 1000;

export function scoreSignature(scores: Record<string, number>) {
	return JSON.stringify(
		Object.entries(scores).sort(([a], [b]) => a.localeCompare(b))
	);
}

export function useJudgeScoreDraft({
	userId,
	assignmentId,
	criteria,
	savedScores,
	ready
}: {
	userId: string;
	assignmentId: string;
	criteria: Criterion[];
	savedScores: { criteriaId: string; value: number }[];
	ready: boolean;
}) {
	const key = `judge-score-draft:${encodeURIComponent(userId)}:${assignmentId}`;
	const rubric = JSON.stringify(
		criteria.map(({ id, maxScore, isSidepot, description }) => [
			id,
			maxScore,
			isSidepot,
			description
		])
	);
	const baselineScores = Object.fromEntries(
		savedScores
			.filter((score) =>
				criteria.some((criterion) => criterion.id === score.criteriaId)
			)
			.map((score) => [score.criteriaId, score.value])
	);
	const baseline = scoreSignature(baselineScores);
	const scope = `${key}:${rubric}`;
	const [state, setState] = useState({
		scope: "",
		baseline: "",
		scores: {} as Record<string, number>,
		notice: "",
		storageAvailable: true
	});

	useEffect(() => {
		if (!ready || state.scope === scope) return;
		let scores = baselineScores;
		let notice = "";
		let storageAvailable = true;
		try {
			const raw = localStorage.getItem(key);
			if (raw) {
				let decoded: unknown;
				try {
					decoded = JSON.parse(raw);
				} catch {
					decoded = null;
				}
				const parsed = draftSchema.safeParse(decoded);
				if (
					parsed.success &&
					parsed.data.rubric === rubric &&
					parsed.data.baseline === baseline &&
					Date.now() - parsed.data.savedAt <= MAX_DRAFT_AGE &&
					Object.entries(parsed.data.scores).every(([id, value]) =>
						criteria.some(
							(criterion) => criterion.id === id && value <= criterion.maxScore
						)
					)
				) {
					scores = parsed.data.scores;
					notice = "Your unfinished draft was restored from this device.";
				} else {
					notice =
						"An older draft could not be restored because it expired, the rubric changed, or newer scores were submitted. Your submitted scores are shown.";
					localStorage.removeItem(key);
				}
			}
		} catch {
			storageAvailable = false;
			notice =
				"Device saving is unavailable. Keep this page open until you submit your scores.";
		}
		setState({ scope, baseline, scores, notice, storageAvailable });
	}, [
		ready,
		scope,
		state.scope,
		key,
		rubric,
		baseline,
		baselineScores,
		criteria
	]);

	const dirty =
		state.scope === scope && scoreSignature(state.scores) !== state.baseline;
	useEffect(() => {
		if (!dirty || state.storageAvailable) return;
		const warn = (event: BeforeUnloadEvent) => {
			event.preventDefault();
			event.returnValue = "";
		};
		window.addEventListener("beforeunload", warn);
		return () => window.removeEventListener("beforeunload", warn);
	}, [dirty, state.storageAvailable]);

	const updateScore = (id: string, value: number | undefined) => {
		const scores = { ...state.scores };
		if (value === undefined) delete scores[id];
		else scores[id] = value;
		let storageAvailable = true;
		try {
			// Persist immediately so navigating away cannot race the next effect.
			if (scoreSignature(scores) === state.baseline)
				localStorage.removeItem(key);
			else
				localStorage.setItem(
					key,
					JSON.stringify({
						version: 1,
						rubric,
						baseline: state.baseline,
						savedAt: Date.now(),
						scores
					})
				);
		} catch {
			storageAvailable = false;
		}
		setState((current) => ({
			...current,
			scores,
			storageAvailable,
			notice: storageAvailable
				? ""
				: "Device saving is unavailable. Keep this page open until you submit your scores."
		}));
	};
	const clearDraft = () => {
		try {
			localStorage.removeItem(key);
		} catch {
			/* A stale draft is rejected against the next server baseline. */
		}
		setState((current) => ({
			...current,
			baseline: scoreSignature(current.scores),
			notice: ""
		}));
	};
	return {
		scores: state.scores,
		updateScore,
		clearDraft,
		dirty,
		notice: state.notice,
		storageAvailable: state.storageAvailable,
		initialized: ready && state.scope === scope
	};
}
