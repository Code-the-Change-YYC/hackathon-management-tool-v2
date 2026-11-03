"use client";

import { ArrowLeftLine, ArrowRightLine } from "@mingcute/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
	ConfirmAlertDialog,
	useConfirmDialog
} from "@/app/components/ConfirmAlertDialog";
import { Alert, AlertDescription } from "@/app/components/ui/alert";
import { Button, buttonVariants } from "@/app/components/ui/button";
import { cn } from "@/lib/utils";
import {
	type Criterion,
	isCriterionScoreValid,
	isScorecardComplete,
	type JudgeAssignment
} from "../judgePortal";
import { CriterionStep } from "./CriterionStep";
import { ScoreReview } from "./ScoreReview";
import type { Scorecard } from "./useJudgeScorecard";

// Long enough to see the chosen score highlight before the next step appears.
const ADVANCE_DELAY_MS = 350;

// A fully scored team opens on review; otherwise scoring resumes at the first gap.
function getStartingStep(
	criteria: Criterion[],
	scores: Record<string, number>
) {
	const firstUnscored = criteria.findIndex(
		(criterion) => !isCriterionScoreValid(criterion, scores[criterion.id])
	);
	return firstUnscored === -1 ? criteria.length : firstUnscored;
}

function DashboardLink({
	warnBeforeLeaving,
	disabled
}: {
	warnBeforeLeaving: boolean;
	disabled: boolean;
}) {
	const router = useRouter();
	const { confirm, dialogProps } = useConfirmDialog();

	return (
		<>
			<ConfirmAlertDialog {...dialogProps} />
			<Link
				aria-label="Back to dashboard"
				className={buttonVariants({ variant: "ghost", size: "icon-lg" })}
				href="/judge"
				onClick={async (event) => {
					if (disabled) {
						event.preventDefault();
						return;
					}
					if (!warnBeforeLeaving) return;
					event.preventDefault();
					const leave = await confirm({
						title: "Leave scoring?",
						description:
							"Device saving is unavailable. Your unsaved scores will be lost.",
						confirmLabel: "Leave",
						destructive: true
					});
					if (leave) router.push("/judge");
				}}
			>
				<ArrowLeftLine aria-hidden className="size-5" />
			</Link>
		</>
	);
}

function ScoreProgress({
	criteria,
	scores
}: {
	criteria: Criterion[];
	scores: Record<string, number>;
}) {
	return (
		<div aria-hidden className="flex gap-1.5">
			{criteria.map((criterion) => (
				<span
					className={cn(
						"h-1.5 flex-1 rounded-full bg-grey-200 transition-colors",
						isCriterionScoreValid(criterion, scores[criterion.id]) &&
							"bg-primary"
					)}
					key={criterion.id}
				/>
			))}
		</div>
	);
}

export function ScoreFlow({
	assignment,
	criteria,
	card
}: {
	assignment: JudgeAssignment;
	criteria: Criterion[];
	card: Scorecard;
}) {
	const reviewStep = criteria.length;
	const [step, setStep] = useState(() =>
		getStartingStep(criteria, card.scores)
	);
	const advanceTimer = useRef<number>(undefined);
	const stepContainer = useRef<HTMLDivElement>(null);
	const shownStep = useRef(step);

	useEffect(() => () => window.clearTimeout(advanceTimer.current), []);

	// Move focus to each new step so keyboard and screen reader users follow along.
	useEffect(() => {
		if (shownStep.current === step) return;
		shownStep.current = step;
		stepContainer.current?.focus();
	}, [step]);

	const goTo = (target: number) => {
		window.clearTimeout(advanceTimer.current);
		setStep(target);
	};

	const selectScore = (criterion: Criterion, value: number) => {
		card.updateScore(criterion.id, value);
		const scores = { ...card.scores, [criterion.id]: value };
		const target = isScorecardComplete(criteria, scores)
			? reviewStep
			: step + 1;
		window.clearTimeout(advanceTimer.current);
		advanceTimer.current = window.setTimeout(
			() => setStep(target),
			ADVANCE_DELAY_MS
		);
	};

	const criterion = criteria[step];
	const saving = card.status === "saving";
	const submitLabel = assignment.scores.length
		? "Update scores"
		: "Submit scores";

	return (
		<div className="mx-auto flex w-full max-w-2xl flex-col gap-10">
			<header className="flex flex-col gap-4">
				<div className="-ml-2 flex items-center gap-1">
					<DashboardLink
						disabled={saving}
						warnBeforeLeaving={card.dirty && !card.storageAvailable}
					/>
					<h1 className="wrap-break-word m-0 min-w-0 font-medium text-base">
						{assignment.team.name}
					</h1>
				</div>
				<ScoreProgress criteria={criteria} scores={card.scores} />
			</header>
			{card.notice && (
				<Alert role="status">
					<AlertDescription>{card.notice}</AlertDescription>
				</Alert>
			)}
			<div
				className="fade-in slide-in-from-bottom-4 outline-none duration-300 motion-safe:animate-in"
				key={step}
				ref={stepContainer}
				tabIndex={-1}
			>
				{criterion ? (
					<CriterionStep
						criterion={criterion}
						onSelect={(value) => selectScore(criterion, value)}
						position={step + 1}
						score={card.scores[criterion.id]}
						total={criteria.length}
					/>
				) : (
					<ScoreReview
						criteria={criteria}
						disabled={saving}
						onEdit={goTo}
						scores={card.scores}
					/>
				)}
			</div>
			{card.error && (
				<Alert variant="destructive">
					<AlertDescription>
						{card.error} Your scores are still here. Try submitting again.
					</AlertDescription>
				</Alert>
			)}
			<nav aria-label="Scoring steps" className="flex items-center gap-3">
				{step > 0 && (
					<Button
						disabled={saving}
						onClick={() => goTo(step - 1)}
						variant="ghost"
					>
						<ArrowLeftLine data-icon="inline-start" />
						Back
					</Button>
				)}
				{criterion ? (
					<Button
						className="ml-auto"
						disabled={
							!isCriterionScoreValid(criterion, card.scores[criterion.id])
						}
						onClick={() => goTo(step + 1)}
					>
						Next
						<ArrowRightLine data-icon="inline-end" />
					</Button>
				) : (
					<Button
						className="ml-auto"
						disabled={saving || !card.complete}
						onClick={() => void card.submit()}
					>
						{saving ? "Submitting…" : submitLabel}
					</Button>
				)}
			</nav>
		</div>
	);
}
