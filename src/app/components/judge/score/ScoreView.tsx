"use client";

import { ArrowLeftLine, ArrowRightLine, CheckLine } from "@mingcute/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type ReactNode, useEffect, useRef, useState } from "react";
import {
	ConfirmAlertDialog,
	useConfirmDialog
} from "@/app/components/ConfirmAlertDialog";
import { Alert, AlertDescription } from "@/app/components/ui/alert";
import { Badge } from "@/app/components/ui/badge";
import { Button, buttonVariants } from "@/app/components/ui/button";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyTitle
} from "@/app/components/ui/empty";
import { useCurrentTime } from "@/hooks/use-current-time";
import {
	type Criterion,
	formatTime,
	getTeamCode,
	isAssignmentScored,
	isCriterionScoreValid,
	type JudgeAssignment,
	sortCriteria
} from "../judgePortal";
import { CriterionScore } from "./JudgeScoreCriterion";
import { ScoreReview } from "./JudgeScoreSummary";
import { ScoreSkeleton } from "./ScoreSkeleton";
import { useJudgeScorecard } from "./useJudgeScorecard";

function canScoreAssignment(
	assignment: JudgeAssignment,
	_criteria: Criterion[],
	currentTime: Date
) {
	return (
		assignment.scores.length > 0 ||
		!assignment.timeSlot ||
		assignment.timeSlot <= currentTime
	);
}

function ScoreMessage({
	title,
	children,
	onRetry,
	roundId
}: {
	title: string;
	children: ReactNode;
	onRetry?: () => void;
	roundId?: string;
}) {
	return (
		<Empty className="mx-auto max-w-xl py-16">
			<EmptyHeader>
				<EmptyTitle>
					<h1 className="m-0 font-semibold text-xl">{title}</h1>
				</EmptyTitle>
				<EmptyDescription>{children}</EmptyDescription>
			</EmptyHeader>
			<div className="flex flex-wrap justify-center gap-3">
				{onRetry ? (
					<Button onClick={onRetry} variant="outline">
						Try again
					</Button>
				) : null}
				<Link
					className={buttonVariants({ variant: "outline" })}
					href={
						roundId
							? `/judge/schedule?round=${encodeURIComponent(roundId)}`
							: "/judge/schedule"
					}
				>
					Back to schedule
				</Link>
			</div>
		</Empty>
	);
}

function JudgeScorecard({
	assignment,
	criteria,
	assignments,
	userId,
	userName
}: {
	assignment: JudgeAssignment;
	criteria: Criterion[];
	assignments: JudgeAssignment[];
	userId: string;
	userName: string;
}) {
	const { confirm, dialogProps } = useConfirmDialog();
	const router = useRouter();
	const currentTime = useCurrentTime();
	const card = useJudgeScorecard(assignment, criteria, userId);
	const [step, setStep] = useState(0);
	const focusTarget = useRef<HTMLDivElement>(null);
	const priorStep = useRef(step);
	useEffect(() => {
		if (priorStep.current !== step) {
			focusTarget.current?.focus();
			priorStep.current = step;
		}
	}, [step]);
	const active = criteria[step];
	const reviewing = step >= criteria.length;
	const saving = card.status === "saving";
	const main = criteria.filter((criterion) => !criterion.isSidepot);
	const mainTotal = main.reduce(
		(sum, criterion) => sum + (card.scores[criterion.id] ?? 0),
		0
	);
	const mainMax = main.reduce((sum, criterion) => sum + criterion.maxScore, 0);
	const answered = criteria.filter((criterion) =>
		isCriterionScoreValid(criterion, card.scores[criterion.id])
	).length;
	const next = assignments.find(
		(item) =>
			item.id !== assignment.id &&
			item.room.roundId === assignment.room.roundId &&
			!isAssignmentScored(item, criteria) &&
			canScoreAssignment(item, criteria, currentTime)
	);

	if (card.status === "saved")
		return (
			<ScoreMessage
				roundId={assignment.room.roundId}
				title="Your scores have been submitted"
			>
				<span className="flex flex-col gap-3">
					<span>
						{assignment.team.name} · {assignment.room.round.name}
					</span>
					<span>
						{main.length
							? `Your main score: ${mainTotal}/${mainMax}. Side pots are recorded separately.`
							: "Your side-pot scores have been recorded."}
					</span>
					<span>
						Your assessment is saved independently. Final results average the
						submitted judge scorecards.
					</span>
					{next ? (
						<Link className={buttonVariants()} href={`/judge/score/${next.id}`}>
							Score {next.team.name}
						</Link>
					) : null}
				</span>
			</ScoreMessage>
		);
	if (!card.initialized) return <ScoreSkeleton />;
	if (!canScoreAssignment(assignment, criteria, currentTime))
		return (
			<ScoreMessage title="Scoring has not opened yet">
				You can score this team from {formatTime(assignment.timeSlot)}. Your
				draft will be kept on this device.
			</ScoreMessage>
		);

	return (
		<div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6 sm:px-8">
			<ConfirmAlertDialog {...dialogProps} />
			<header className="flex flex-col gap-4 border-border border-b pb-5">
				<div className="flex flex-wrap items-start justify-between gap-4">
					<div className="min-w-0">
						<Link
							className="inline-flex items-center gap-1 text-muted-foreground text-sm underline-offset-4 hover:text-foreground hover:underline"
							href={`/judge/schedule?round=${encodeURIComponent(assignment.room.roundId)}`}
							onClick={async (event) => {
								if (saving) {
									event.preventDefault();
									return;
								}
								if (card.dirty && !card.storageAvailable) {
									event.preventDefault();
									if (
										await confirm({
											title: "Leave scoring?",
											description:
												"Device saving is unavailable. Your unsaved scores will be lost.",
											confirmLabel: "Leave",
											destructive: true
										})
									)
										router.push(
											`/judge/schedule?round=${encodeURIComponent(assignment.room.roundId)}`
										);
								}
							}}
						>
							<ArrowLeftLine aria-hidden className="size-4" /> Schedule
						</Link>
						<h1 className="mt-3 mb-1 break-words font-semibold text-2xl">
							{assignment.team.name}
						</h1>
						<p className="m-0 text-muted-foreground text-sm">
							Team {getTeamCode(assignment)} · {assignment.room.round.name} ·{" "}
							{formatTime(assignment.timeSlot)}
						</p>
					</div>
					{main.length ? (
						<div className="text-right">
							<p className="m-0 text-muted-foreground text-sm">
								Your main score
							</p>
							<p className="mt-1 mb-0 font-semibold text-xl tabular-nums">
								{mainTotal}
								<span className="font-normal text-base text-muted-foreground">
									{" "}
									/ {mainMax}
								</span>
							</p>
						</div>
					) : (
						<Badge variant="secondary">Side-pot scoring</Badge>
					)}
				</div>
				<div className="flex flex-wrap items-center justify-between gap-2 text-muted-foreground text-xs">
					<span>Scoring as {userName} · Your individual assessment</span>
					<output>
						{card.dirty
							? card.storageAvailable
								? "Draft saved on this device · Not submitted"
								: "Draft not saved · Keep this page open"
							: assignment.scores.length
								? "Your submitted scores · Changes require resubmission"
								: "No scores submitted yet"}
					</output>
				</div>
			</header>
			<nav aria-label="Scoring progress" className="flex flex-col gap-3">
				<p className="m-0 text-muted-foreground text-sm">
					{answered} of {criteria.length} criteria scored
				</p>
				<ol className="m-0 flex list-none flex-wrap gap-2 p-0">
					{criteria.map((criterion, index) => (
						<li className="min-w-0 max-w-full" key={criterion.id}>
							<Button
								aria-current={step === index ? "step" : undefined}
								className="h-auto min-h-9 max-w-full whitespace-normal text-left"
								disabled={saving}
								onClick={() => setStep(index)}
								size="sm"
								variant={step === index ? "default" : "outline"}
							>
								{isCriterionScoreValid(criterion, card.scores[criterion.id]) ? (
									<CheckLine aria-hidden data-icon="inline-start" />
								) : null}
								<span className="min-w-0 break-words">{criterion.name}</span>
								<span className="shrink-0 tabular-nums">
									{card.scores[criterion.id] ?? "–"}/{criterion.maxScore}
								</span>
							</Button>
						</li>
					))}
					<li>
						<Button
							aria-current={reviewing ? "step" : undefined}
							disabled={saving}
							onClick={() => setStep(criteria.length)}
							size="sm"
							variant={reviewing ? "default" : "outline"}
						>
							Review
						</Button>
					</li>
				</ol>
			</nav>
			{card.notice ? (
				<Alert role="status">
					<AlertDescription>{card.notice}</AlertDescription>
				</Alert>
			) : null}
			<div className="outline-none" ref={focusTarget} tabIndex={-1}>
				{active && !reviewing ? (
					<CriterionScore
						criterion={active}
						disabled={saving}
						key={active.id}
						onChange={(value) => card.updateScore(active.id, value)}
						score={card.scores[active.id]}
					/>
				) : (
					<ScoreReview
						criteria={criteria}
						disabled={saving}
						onEdit={setStep}
						scores={card.scores}
					/>
				)}
			</div>
			{card.error ? (
				<Alert variant="destructive">
					<AlertDescription>
						{card.error} Your answers are still here. Try submitting again.
					</AlertDescription>
				</Alert>
			) : null}
			<footer className="flex flex-col gap-3 border-border border-t pt-5">
				{reviewing && !card.complete ? (
					<p className="m-0 text-muted-foreground text-sm">
						Score the remaining {criteria.length - answered}{" "}
						{criteria.length - answered === 1 ? "criterion" : "criteria"} before
						submitting. Use Edit to return to an unanswered item.
					</p>
				) : null}
				<div className="flex flex-wrap items-center justify-between gap-3">
					<Button
						disabled={saving || step === 0}
						onClick={() => setStep((value) => Math.max(0, value - 1))}
						variant="outline"
					>
						<ArrowLeftLine data-icon="inline-start" />
						Previous
					</Button>
					{reviewing ? (
						<Button
							disabled={saving || !card.complete}
							onClick={() => {
								void card.submit();
							}}
						>
							{saving
								? "Submitting your scores…"
								: assignment.scores.length
									? "Update my scores"
									: "Submit my scores"}
						</Button>
					) : (
						<Button
							onClick={() =>
								setStep((value) => Math.min(criteria.length, value + 1))
							}
						>
							{step === criteria.length - 1
								? "Review scores"
								: "Next criterion"}
							<ArrowRightLine data-icon="inline-end" />
						</Button>
					)}
				</div>
			</footer>
		</div>
	);
}

export function ScoreView({
	assignment,
	assignments,
	criteria,
	userId,
	userName
}: {
	assignment: JudgeAssignment | null;
	assignments: JudgeAssignment[];
	criteria: Criterion[];
	userId: string;
	userName: string;
}) {
	if (!assignment)
		return (
			<ScoreMessage title="Assignment unavailable">
				This team is not assigned to your judging account.
			</ScoreMessage>
		);
	if (!criteria.length)
		return (
			<ScoreMessage title="No criteria available">
				Organizers need to publish the judging criteria before you can score
				this team.
			</ScoreMessage>
		);
	return (
		<JudgeScorecard
			assignment={assignment}
			assignments={assignments}
			criteria={criteria.slice().sort(sortCriteria)}
			key={`${userId}:${assignment.id}`}
			userId={userId}
			userName={userName}
		/>
	);
}
