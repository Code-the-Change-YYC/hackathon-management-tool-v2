"use client";

import { ArrowLeftLine, ArrowRightLine, CheckLine } from "@mingcute/react";
import Link from "next/link";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { Badge } from "@/app/components/ui/badge";
import { Button, buttonVariants } from "@/app/components/ui/button";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyTitle
} from "@/app/components/ui/empty";
import {
	Field,
	FieldDescription,
	FieldGroup,
	FieldLabel
} from "@/app/components/ui/field";
import { ToggleGroup, ToggleGroupItem } from "@/app/components/ui/toggle-group";
import { useCurrentTime } from "@/hooks/use-current-time";
import { getRubricBands } from "@/lib/judging";
import { cn } from "@/lib/utils";
import { useJudgeUser } from "./JudgeUserProvider";
import {
	type Criterion,
	canScoreAssignment,
	formatTime,
	getBandDescription,
	getCriterionDescription,
	getScoreOptions,
	getTeamCode,
	type JudgeAssignment
} from "./judgePortal";
import { LoadingCard } from "./LoadingCard";
import { useJudgePortalData } from "./useJudgePortalData";
import { useJudgeScorecard } from "./useJudgeScorecard";

function ScoreMessage({
	title,
	children,
	onRetry
}: {
	title: string;
	children: ReactNode;
	onRetry?: () => void;
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
					href="/judge/schedule"
				>
					Back to schedule
				</Link>
			</div>
		</Empty>
	);
}

function CriterionScore({
	criterion,
	score,
	onChange,
	disabled
}: {
	criterion: Criterion;
	score?: number;
	onChange: (value: number | undefined) => void;
	disabled: boolean;
}) {
	const bands = getRubricBands(criterion.maxScore, criterion.isSidepot);
	const selectedBand = bands.find(
		(band) => score !== undefined && score >= band.min && score <= band.max
	);
	return (
		<section
			aria-labelledby={`criterion-${criterion.id}`}
			className="flex flex-col gap-6"
		>
			<div className="flex flex-col gap-3">
				<div className="flex flex-wrap items-center gap-3">
					<h2
						className="m-0 break-words font-semibold text-xl"
						id={`criterion-${criterion.id}`}
					>
						{criterion.name}
					</h2>
					{criterion.isSidepot ? (
						<Badge variant="secondary">Side pot</Badge>
					) : null}
				</div>
				<p className="m-0 max-w-prose whitespace-pre-line break-words text-muted-foreground text-sm leading-relaxed">
					{getCriterionDescription(criterion)}
				</p>
				{!criterion.description.trim() ? (
					<p className="m-0 text-muted-foreground text-xs">
						No criterion-specific description has been provided. General
						guidance is shown.
					</p>
				) : null}
			</div>
			<FieldGroup>
				<Field>
					<FieldLabel id={`score-label-${criterion.id}`}>
						Your score{" "}
						<span className="text-muted-foreground">
							/ {criterion.maxScore}
						</span>
					</FieldLabel>
					<ToggleGroup
						aria-labelledby={`score-label-${criterion.id}`}
						className="max-w-full flex-wrap gap-2"
						disabled={disabled}
						onValueChange={(values) => {
							onChange(
								typeof values[0] === "string" ? Number(values[0]) : undefined
							);
						}}
						value={score === undefined ? [] : [String(score)]}
						variant="score"
					>
						{getScoreOptions(criterion, criterion.isSidepot, score).map(
							(value) => (
								<ToggleGroupItem
									aria-label={`${value} points`}
									className="min-h-11 min-w-11"
									key={value}
									value={String(value)}
								>
									{value}
								</ToggleGroupItem>
							)
						)}
					</ToggleGroup>
					<FieldDescription>
						{criterion.isSidepot
							? "Choose 0 if there is no evidence for this side pot. Side pots are separate from the main score."
							: "Select the score that best matches the project's evidence. Select it again to clear."}
					</FieldDescription>
				</Field>
			</FieldGroup>
			<div aria-live="polite" className="rounded-lg bg-muted/50 p-4">
				<p className="m-0 font-medium text-sm">
					{selectedBand
						? `${selectedBand.label} · ${selectedBand.range} points`
						: score === 0
							? "0 points selected"
							: "Rubric at a glance"}
				</p>
				<p className="mt-1 mb-0 max-w-prose text-muted-foreground text-sm leading-relaxed">
					{selectedBand
						? getBandDescription(criterion, selectedBand.label)
						: "Use the score ranges below to match the team's work to the rubric. Your selection will appear here."}
				</p>
			</div>
			<details className="rounded-lg border border-border">
				<summary className="cursor-pointer rounded-lg px-4 py-3 font-medium text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring">
					View all score ranges
				</summary>
				<dl className="m-0 border-border border-t px-4">
					{bands.map((band) => (
						<div
							className={cn(
								"grid grid-cols-[6rem_minmax(0,1fr)] gap-4 not-last:border-border not-last:border-b py-3 sm:grid-cols-[9rem_minmax(0,1fr)]",
								selectedBand === band && "bg-muted/50"
							)}
							key={band.label}
						>
							<dt className="flex flex-col gap-1">
								<span className="font-medium text-sm tabular-nums">
									{band.range} pts
								</span>
								<span className="text-muted-foreground text-xs">
									{band.label}
								</span>
							</dt>
							<dd className="m-0 break-words text-muted-foreground text-sm leading-relaxed">
								{getBandDescription(criterion, band.label)}
							</dd>
						</div>
					))}
				</dl>
			</details>
		</section>
	);
}

function ScoreReview({
	criteria,
	scores,
	onEdit,
	disabled
}: {
	criteria: Criterion[];
	scores: Record<string, number>;
	onEdit: (index: number) => void;
	disabled: boolean;
}) {
	return (
		<section
			aria-labelledby="score-review-heading"
			className="flex flex-col gap-5"
		>
			<div>
				<h2 className="m-0 font-semibold text-xl" id="score-review-heading">
					Review your scores
				</h2>
				<p className="mt-2 mb-0 text-muted-foreground text-sm">
					Check each assessment before submitting. These are your individual
					scores.
				</p>
			</div>
			{[false, true].map((isSidepot) => {
				const group = criteria.filter(
					(criterion) => criterion.isSidepot === isSidepot
				);
				return group.length ? (
					<div className="flex flex-col gap-2" key={String(isSidepot)}>
						<h3 className="m-0 font-medium text-sm">
							{isSidepot ? "Side pots · scored separately" : "Main criteria"}
						</h3>
						<div className="divide-y divide-border rounded-lg border border-border">
							{group.map((criterion) => (
								<div
									className="flex items-center gap-3 px-4 py-3"
									key={criterion.id}
								>
									<div className="min-w-0 flex-1">
										<p className="m-0 break-words font-medium text-sm">
											{criterion.name}
										</p>
										<p className="mt-1 mb-0 text-muted-foreground text-xs">
											{Object.hasOwn(scores, criterion.id)
												? `${scores[criterion.id]} / ${criterion.maxScore} points`
												: "Not scored yet"}
										</p>
									</div>
									<Button
										aria-label={`Edit ${criterion.name}`}
										disabled={disabled}
										onClick={() =>
											onEdit(
												criteria.findIndex((item) => item.id === criterion.id)
											)
										}
										size="sm"
										variant="ghost"
									>
										Edit
									</Button>
								</div>
							))}
						</div>
					</div>
				) : null;
			})}
		</section>
	);
}

function JudgeScorecard({
	assignment,
	criteria,
	assignments
}: {
	assignment: JudgeAssignment;
	criteria: Criterion[];
	assignments: JudgeAssignment[];
}) {
	const { userName } = useJudgeUser();
	const currentTime = useCurrentTime();
	const card = useJudgeScorecard(assignment, criteria);
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
		Object.hasOwn(card.scores, criterion.id)
	).length;
	const next = assignments.find(
		(item) =>
			item.id !== assignment.id &&
			item.room.roundId === assignment.room.roundId &&
			!criteria.every((criterion) =>
				item.scores.some((score) => score.criteriaId === criterion.id)
			) &&
			canScoreAssignment(item, criteria, currentTime)
	);

	if (card.status === "saved")
		return (
			<ScoreMessage title="Your scores have been submitted">
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
	if (card.scoresQuery.isError)
		return (
			<ScoreMessage
				onRetry={() => {
					void card.scoresQuery.refetch();
				}}
				title="Your saved scores could not be loaded"
			>
				Try again before editing so you don't overwrite an existing assessment.
			</ScoreMessage>
		);
	if (!card.initialized) return <LoadingCard label="Loading your scorecard…" />;
	if (!canScoreAssignment(assignment, criteria, currentTime))
		return (
			<ScoreMessage title="Scoring has not opened yet">
				You can score this team from {formatTime(assignment.timeSlot)}. Your
				draft will be kept on this device.
			</ScoreMessage>
		);

	return (
		<div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6 sm:px-8">
			<header className="flex flex-col gap-4 border-border border-b pb-5">
				<div className="flex flex-wrap items-start justify-between gap-4">
					<div className="min-w-0">
						<Link
							className="inline-flex items-center gap-1 text-muted-foreground text-sm underline-offset-4 hover:text-foreground hover:underline"
							href="/judge/schedule"
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
							: card.scoresQuery.data?.length
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
								{Object.hasOwn(card.scores, criterion.id) ? (
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
				<output className="m-0 rounded-lg bg-muted px-4 py-3 text-sm">
					{card.notice}
				</output>
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
				<div
					className="rounded-lg border border-destructive/30 px-4 py-3 text-destructive text-sm"
					role="alert"
				>
					{card.error} Your answers are still here. Try submitting again.
				</div>
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
								: card.scoresQuery.data?.length
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

export function JudgeScorePage({ assignmentId }: { assignmentId: string }) {
	const data = useJudgePortalData();
	const { userId } = useJudgeUser();
	if (data.isLoading) return <LoadingCard label="Loading scoring workspace…" />;
	if (data.error)
		return (
			<ScoreMessage
				onRetry={() => {
					void data.refresh();
				}}
				title="Unable to load scoring"
			>
				Judging data could not be loaded. Your device draft will remain
				available.
			</ScoreMessage>
		);
	const assignment = data.assignments.find((item) => item.id === assignmentId);
	if (!assignment)
		return (
			<ScoreMessage title="Assignment unavailable">
				This team is not assigned to your judging account.
			</ScoreMessage>
		);
	if (!data.criteria.length)
		return (
			<ScoreMessage title="No criteria available">
				Organizers need to publish the judging criteria before you can score
				this team.
			</ScoreMessage>
		);
	return (
		<JudgeScorecard
			assignment={assignment}
			assignments={data.assignments}
			criteria={data.criteria}
			key={`${userId}:${assignmentId}`}
		/>
	);
}
