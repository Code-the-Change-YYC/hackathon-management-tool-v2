"use client";

import { ArrowLeftLine, ArrowRightLine } from "@mingcute/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
	ConfirmAlertDialog,
	useConfirmDialog
} from "@/app/components/ConfirmAlertDialog";
import { Button } from "@/app/components/ui/button";
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader
} from "@/app/components/ui/empty";
import { criterionAppliesToRound } from "@/lib/judging";
import { api } from "@/trpc/react";
import {
	type Criterion,
	type JudgeAssignment,
	sortCriteria
} from "../judgePortal";
import {
	JudgeMainCriterion,
	JudgeSidepotCriterion
} from "./JudgeScoreCriterion";
import { JudgeScoreHeader } from "./JudgeScoreHeader";
import { JudgeScoreSummary } from "./JudgeScoreSummary";

export function ScoreView({
	assignment,
	criteria: allCriteria
}: {
	assignment: JudgeAssignment | null;
	criteria: Criterion[];
}) {
	if (!assignment) {
		return (
			<ScorePageMessage
				description="This assignment could not be found for your judging account."
				title="Assignment unavailable"
			/>
		);
	}

	const criteria = allCriteria
		.filter((criterion) =>
			criterionAppliesToRound(criterion, assignment.room.roundId)
		)
		.sort(sortCriteria)
		.map((criterion) =>
			criterion.isSidepot ? criterion : { ...criterion, maxScore: 10 }
		);
	if (criteria.length === 0) {
		return (
			<ScorePageMessage
				description="No judging criteria have been published yet."
				title="No criteria available"
			/>
		);
	}

	return <ScoreWorkspace assignment={assignment} criteria={criteria} />;
}

function ScoreWorkspace({
	assignment,
	criteria
}: {
	assignment: JudgeAssignment;
	criteria: Criterion[];
}) {
	const router = useRouter();
	const { confirm, dialogProps } = useConfirmDialog();
	const createMany = api.scores.createMany.useMutation();
	const [activeStep, setActiveStep] = useState(0);
	const [draftScores, setDraftScores] = useState<Record<string, number> | null>(
		null
	);
	const [message, setMessage] = useState("");
	const [submitting, setSubmitting] = useState(false);
	const mainCriteria = criteria.filter((criterion) => !criterion.isSidepot);
	const sidepotCriteria = criteria.filter((criterion) => criterion.isSidepot);
	const savedScores = Object.fromEntries(
		assignment.scores.map((score) => [score.criteriaId, score.value])
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
		if (!canSubmit || submitting) return;
		setSubmitting(true);
		setMessage("");
		try {
			await createMany.mutateAsync(
				criteria.flatMap((criterion) => {
					const score = scores[criterion.id];
					return score === undefined
						? []
						: [
								{ assignmentId: assignment.id, criteriaId: criterion.id, score }
							];
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
		router.push("/judge");
	};

	return (
		<div className="flex flex-col">
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
			<div className="flex w-full max-w-267.75 flex-col gap-6 pt-6">
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
	description: string;
	title: string;
}) {
	return (
		<Empty className="min-h-[70svh]">
			<EmptyHeader>
				<h1 className="font-semibold text-2xl md:text-3xl">{title}</h1>
				<EmptyDescription>{description}</EmptyDescription>
			</EmptyHeader>
			<EmptyContent>
				<Button nativeButton={false} render={<Link href="/judge" />}>
					Back to dashboard
				</Button>
			</EmptyContent>
		</Empty>
	);
}
