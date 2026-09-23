"use client";

import { ArrowLeftLine, ArrowRightLine } from "@mingcute/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type ReactNode, useEffect, useState } from "react";
import {
	ConfirmAlertDialog,
	useConfirmDialog
} from "@/app/components/ConfirmAlertDialog";
import { Button } from "@/app/components/ui/button";
import { api } from "@/trpc/react";
import {
	JudgeMainCriterion,
	JudgeSidepotCriterion
} from "./JudgeScoreCriterion";
import { JudgeScoreHeader } from "./JudgeScoreHeader";
import { JudgeScoreSummary } from "./JudgeScoreSummary";
import { LoadingCard } from "./LoadingCard";
import { useJudgePortalData, useJudgeUser } from "./useJudgePortalData";

export function JudgeScorePage({ assignmentId }: { assignmentId: string }) {
	const { userId } = useJudgeUser();
	return (
		<ScoringWorkspace
			assignmentId={assignmentId}
			key={`${userId}:${assignmentId}`}
			userId={userId}
		/>
	);
}

function ScoringWorkspace({
	assignmentId,
	userId
}: {
	assignmentId: string;
	userId: string;
}) {
	const router = useRouter();
	const { confirm, dialogProps } = useConfirmDialog();
	const data = useJudgePortalData();
	const utils = api.useUtils();
	const assignment = data.assignments.find((item) => item.id === assignmentId);
	const scoresQuery = api.scores.getByAssignment.useQuery(
		{ assignmentId },
		{ enabled: Boolean(assignment) }
	);
	const createMany = api.scores.createMany.useMutation();
	const [activeStep, setActiveStep] = useState(0);
	const [draftScores, setDraftScores] = useState<Record<string, number> | null>(
		null
	);
	const [message, setMessage] = useState("");
	const [submitting, setSubmitting] = useState(false);
	const criteria = data.criteria.map((criterion) =>
		criterion.isSidepot ? criterion : { ...criterion, maxScore: 10 }
	);
	const mainCriteria = criteria.filter((criterion) => !criterion.isSidepot);
	const sidepotCriteria = criteria.filter((criterion) => criterion.isSidepot);
	const savedScores = Object.fromEntries(
		(scoresQuery.data ?? []).map((score) => [score.criteriaId, score.value])
	);
	const scores = draftScores ?? savedScores;
	const validScore = (id: string, min: number, max: number) => {
		const value = scores[id];
		return (
			value !== undefined &&
			Number.isInteger(value) &&
			value >= min &&
			value <= max
		);
	};

	const mainComplete = mainCriteria.every((criterion) =>
		validScore(criterion.id, 1, 10)
	);
	const selectedCriteria = criteria.filter(
		(criterion) => scores[criterion.id] !== undefined
	);
	const canSubmit =
		mainComplete &&
		selectedCriteria.length > 0 &&
		selectedCriteria.every((criterion) =>
			validScore(criterion.id, criterion.isSidepot ? 0 : 1, criterion.maxScore)
		);
	const reviewStep = mainCriteria.length + (sidepotCriteria.length > 0 ? 1 : 0);
	const step = Math.min(activeStep, reviewStep);
	const reviewing = step === reviewStep;
	const activeCriterion = mainCriteria[step];

	useEffect(() => {
		if (draftScores === null) return;
		const preventUnload = (event: BeforeUnloadEvent) => event.preventDefault();
		window.addEventListener("beforeunload", preventUnload);
		return () => window.removeEventListener("beforeunload", preventUnload);
	}, [draftScores]);

	const updateScore = (criterionId: string, score: number) => {
		setDraftScores((current) => ({
			...(current ?? savedScores),
			[criterionId]: score
		}));
		setMessage("");
	};
	const leaveScoring = async () => {
		if (submitting) return;
		if (
			draftScores !== null &&
			!(await confirm({
				title: "Leave scoring?",
				description: "You have unsaved score changes that will be lost.",
				confirmLabel: "Leave",
				destructive: true
			}))
		)
			return;
		router.push("/judge");
	};
	const submitScores = async () => {
		if (!assignment || !canSubmit || submitting) return;
		setSubmitting(true);
		setMessage("");
		try {
			await createMany.mutateAsync(
				criteria.flatMap((criterion) => {
					const score = scores[criterion.id];
					return score === undefined
						? []
						: [{ assignmentId, criteriaId: criterion.id, score }];
				})
			);
		} catch (error) {
			setMessage(
				error instanceof Error
					? error.message
					: "Scores could not be saved. Please try again."
			);
			setSubmitting(false);
			return;
		}
		setDraftScores(null);
		await Promise.allSettled([
			utils.scores.getByAssignment.invalidate({ assignmentId }),
			utils.scores.getByRound.invalidate({ roundId: assignment.room.round.id }),
			utils.scores.getJudgeTotals.invalidate({
				roundId: assignment.room.round.id
			}),
			utils.judgingAssignments.getByJudge.invalidate({ judgeId: userId })
		]);
		router.push("/judge");
	};

	if (data.error || scoresQuery.error)
		return (
			<ScorePageMessage
				description="Your scores could not be loaded. Reload the page to try again."
				title="Unable to load scoring"
			/>
		);
	if (data.isLoading || (assignment && scoresQuery.isLoading))
		return <LoadingCard label="Loading scoring workspace…" />;
	if (!assignment)
		return (
			<ScorePageMessage
				description="This assignment could not be found for your judging account."
				title="Assignment unavailable"
			/>
		);
	if (criteria.length === 0)
		return (
			<ScorePageMessage
				description="No judging criteria have been published yet."
				title="No criteria available"
			/>
		);

	return (
		<div className="min-h-screen bg-grey-50">
			<ConfirmAlertDialog {...dialogProps} />
			<JudgeScoreHeader
				activeStep={step}
				assignment={assignment}
				criteria={criteria}
				mainCriteria={mainCriteria}
				onLeave={leaveScoring}
				scores={scores}
				sidepotCriteria={sidepotCriteria}
			/>
			<div className="mx-auto flex w-full max-w-267.75 flex-col gap-6 px-4 py-6 sm:px-8 lg:px-6">
				<fieldset className="min-w-0" disabled={submitting}>
					{reviewing ? (
						<section
							aria-labelledby="score-review-title"
							className="flex flex-col gap-6"
						>
							<h1 className="font-semibold text-[28px]" id="score-review-title">
								Review your scores
							</h1>
							<p>
								Your main total excludes sidepots. You can return to edit your
								scores after submitting.
							</p>
							<JudgeScoreSummary
								criteria={criteria}
								mainCriteria={mainCriteria}
								scores={scores}
								sidepotCriteria={sidepotCriteria}
							/>
							<ul className="flex flex-col gap-3">
								{criteria.map((criterion) => (
									<li
										className="flex items-center justify-between gap-3"
										key={criterion.id}
									>
										<span>
											{criterion.name}:{" "}
											{scores[criterion.id] ??
												(criterion.isSidepot
													? "Not scored (optional)"
													: "Score required")}
										</span>
										<Button
											onClick={() =>
												setActiveStep(
													criterion.isSidepot
														? mainCriteria.length
														: mainCriteria.findIndex(
																(item) => item.id === criterion.id
															)
												)
											}
											variant="outline"
										>
											Edit {criterion.name}
										</Button>
									</li>
								))}
							</ul>
							{!canSubmit && (
								<output>
									Score every main category from 1–10 before submitting.
									Sidepots are optional.
								</output>
							)}
						</section>
					) : activeCriterion ? (
						<JudgeMainCriterion
							criterion={activeCriterion}
							onScoreChange={updateScore}
							score={scores[activeCriterion.id]}
						/>
					) : (
						<section
							aria-labelledby="sidepot-title"
							className="flex flex-col gap-6"
						>
							<h1 className="font-semibold text-[28px]" id="sidepot-title">
								Side pots
							</h1>
							<p>Optional awards, scored separately from your main total.</p>
							{sidepotCriteria.map((criterion) => (
								<JudgeSidepotCriterion
									criterion={criterion}
									key={criterion.id}
									onScoreChange={updateScore}
									score={scores[criterion.id]}
								/>
							))}
						</section>
					)}
				</fieldset>
				{message && (
					<p className="text-destructive" role="alert">
						{message}
					</p>
				)}
				<div className="flex flex-wrap items-center justify-between gap-3 py-5">
					<Button
						disabled={submitting}
						onClick={() =>
							step === 0 ? void leaveScoring() : setActiveStep(step - 1)
						}
						variant="outline"
					>
						<ArrowLeftLine data-icon="inline-start" />
						Prev
					</Button>
					{reviewing ? (
						<Button disabled={!canSubmit || submitting} onClick={submitScores}>
							{submitting ? "Submitting…" : "Submit scores"}
						</Button>
					) : (
						<Button onClick={() => setActiveStep(step + 1)}>
							{step + 1 === reviewStep ? "Review scores" : "Next"}
							<ArrowRightLine data-icon="inline-end" />
						</Button>
					)}
				</div>
			</div>
		</div>
	);
}
function ScorePageMessage({
	description,
	title
}: {
	description: ReactNode;
	title: string;
}) {
	return (
		<div className="flex min-h-[calc(100vh-57px)] items-center justify-center px-6 py-12 lg:min-h-screen">
			<div className="max-w-md rounded-2xl border border-grey-300 bg-white p-6 text-center shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
				<h1 className="m-0 font-semibold text-[28px] leading-9">{title}</h1>
				<p className="mt-3 mb-0 text-base text-grey-600 leading-6">
					{description}
				</p>
				<Link
					className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-purple-500 px-4 font-medium text-white transition hover:bg-[#6044ed]"
					href="/judge"
				>
					Back to dashboard
				</Link>
			</div>
		</div>
	);
}
