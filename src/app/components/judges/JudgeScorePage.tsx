"use client";

import { ArrowLeftLine, ArrowRightLine } from "@mingcute/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import { useConfirmDialog } from "@/app/components/ConfirmAlertDialog";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { cn } from "@/lib/utils";
import { api } from "@/trpc/react";
import { LoadingCard } from "./judgeSharedUi";
import {
	type Criterion,
	formatTime,
	getBandDescription,
	getCriterionDescription,
	getDraftScore,
	getRubricBands,
	getScoreFillClass,
	getScoreOptions,
	getScoreTextColor,
	getScoreTone,
	getTeamCode,
	hasDraftScore,
	type JudgeAssignment,
	useJudgePortalData,
	useJudgeUser
} from "./useJudgePortalData";

function ScoreStatusChip({
	active,
	criterion,
	score,
	sidepotComplete
}: {
	active: boolean;
	criterion?: Criterion;
	score?: number;
	sidepotComplete?: boolean;
}) {
	if (!criterion) {
		return (
			<Badge
				className={cn(
					"h-auto rounded-full px-3 py-1 text-base leading-6",
					active
						? "bg-foreground text-background hover:bg-foreground/90"
						: sidepotComplete
							? "border-transparent bg-[#f7f5ff] text-[#4a28f6] hover:bg-[#f7f5ff]"
							: "text-[#a5a5a5]"
				)}
				variant={active || sidepotComplete ? "default" : "outline"}
			>
				Side pots
				<span className="flex items-center gap-1">
					<span className="size-1.5 rounded-full bg-current" />
					<span className="size-1.5 rounded-full bg-current opacity-70" />
				</span>
			</Badge>
		);
	}

	if (active) {
		return (
			<Badge className="h-auto rounded-full bg-foreground px-3 py-1 text-background text-base leading-6 hover:bg-foreground/90">
				{criterion.name}
			</Badge>
		);
	}

	if (score === undefined) {
		return (
			<Badge
				className="h-auto rounded-full px-3 py-1 text-[#a5a5a5] text-base leading-6"
				variant="outline"
			>
				{criterion.name}
			</Badge>
		);
	}

	return (
		<Badge
			className={cn(
				"h-auto rounded-full px-3 py-1 text-base leading-6",
				getScoreTone(score, criterion.maxScore)
			)}
			variant="outline"
		>
			{criterion.name}
			<span>{score}</span>
		</Badge>
	);
}

function ScoreTotal({
	criteria,
	scores
}: {
	criteria: Criterion[];
	scores: Record<string, number>;
}) {
	const total = criteria.reduce(
		(sum, criterion) => sum + (getDraftScore(scores, criterion.id) ?? 0),
		0
	);
	const max = criteria.reduce((sum, criterion) => sum + criterion.maxScore, 0);

	return (
		<div className="flex flex-col items-end text-center font-medium">
			<p className="m-0 text-[0px] text-black leading-none">
				<span className="text-[22px] leading-7">{total}</span>
				<span className="text-[#a5a5a5] text-sm leading-5">/{max}</span>
			</p>
			<p className="m-0 text-[#434343] text-[9px] uppercase leading-[14px]">
				Total
			</p>
		</div>
	);
}

function ScoreTopBar({
	activeStep,
	assignment,
	criteria,
	mainCriteria,
	scores,
	sidepotCriteria
}: {
	activeStep: number;
	assignment: JudgeAssignment;
	criteria: Criterion[];
	mainCriteria: Criterion[];
	scores: Record<string, number>;
	sidepotCriteria: Criterion[];
}) {
	const sidepotStepActive = activeStep >= mainCriteria.length;
	const sidepotsComplete =
		sidepotCriteria.length > 0 &&
		sidepotCriteria.every((criterion) => hasDraftScore(scores, criterion.id));

	return (
		<header className="border-[#d6d6d6] border-b bg-[#fafafa] px-6 py-4 sm:px-8">
			<nav className="mb-3 flex items-center gap-1 text-xs leading-4">
				<Link
					className="text-[#a5a5a5] transition hover:text-[#575757]"
					href="/judge"
				>
					Dashboard
				</Link>
				<span className="text-[#a5a5a5]">/</span>
				<span className="font-medium text-[#ec1245]">Score</span>
			</nav>
			<div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
				<div className="flex min-w-0 flex-1 flex-col gap-4 lg:flex-row lg:items-center">
					<div className="min-w-[172px]">
						<h1 className="m-0 truncate font-semibold text-base text-black leading-6">
							{assignment.team.name}
						</h1>
						<div className="mt-0 flex flex-wrap items-center gap-1 text-[#767676] text-[11px] leading-4">
							<span>Team ID: {getTeamCode(assignment)}</span>
							<span aria-hidden="true">•</span>
							<span>{formatTime(assignment.timeSlot)}</span>
							<span aria-hidden="true">•</span>
							<span>{assignment.room.round.name}</span>
						</div>
					</div>

					<div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto pb-1 lg:pl-7">
						{mainCriteria.map((criterion, index) => (
							<ScoreStatusChip
								active={activeStep === index}
								criterion={criterion}
								key={criterion.id}
								score={getDraftScore(scores, criterion.id)}
							/>
						))}
						{sidepotCriteria.length > 0 ? (
							<ScoreStatusChip
								active={sidepotStepActive}
								sidepotComplete={sidepotsComplete}
							/>
						) : null}
					</div>
				</div>

				<ScoreTotal criteria={criteria} scores={scores} />
			</div>
		</header>
	);
}

function ScoreButtonGroup({
	criterion,
	includeZero,
	onChange,
	value
}: {
	criterion: Criterion;
	includeZero: boolean;
	onChange: (value: number) => void;
	value?: number;
}) {
	return (
		<div className="flex flex-wrap gap-3">
			{getScoreOptions(criterion, includeZero, value).map((option) => {
				const selected = value === option;
				return (
					<button
						aria-pressed={selected}
						className={`flex h-14 w-[62px] items-center justify-center rounded-lg border font-medium text-base transition ${
							selected
								? `border-transparent ${getScoreFillClass(
										option,
										criterion.maxScore
									)}`
								: "border-[#e6e6e6] bg-white text-[#575757] hover:border-[#7054fd] hover:bg-[#f7f5ff]"
						}`}
						key={option}
						onClick={() => onChange(option)}
						type="button"
					>
						{option}
					</button>
				);
			})}
		</div>
	);
}

function RubricBandCard({
	band,
	criterion,
	selected
}: {
	band: ReturnType<typeof getRubricBands>[number];
	criterion: Criterion;
	selected: boolean;
}) {
	const toneValue = band.max;
	return (
		<article
			className={`rounded-lg border p-3 ${
				selected
					? getScoreTone(toneValue, criterion.maxScore)
					: "border-[#e6e6e6] bg-white"
			}`}
		>
			<div className="mb-2 flex items-center gap-2">
				<p
					className={`m-0 text-2xl leading-8 ${getScoreTextColor(
						toneValue,
						criterion.maxScore
					)}`}
				>
					{band.range}
				</p>
				<p className="m-0 font-medium text-[#292929] text-xs uppercase leading-4">
					{band.label}
				</p>
			</div>
			<p className="m-0 text-[#292929] text-[13px] leading-[18px]">
				{getBandDescription(criterion, band.label)}
			</p>
		</article>
	);
}

function RubricBandGrid({
	criterion,
	includeZero,
	selectedScore
}: {
	criterion: Criterion;
	includeZero: boolean;
	selectedScore?: number;
}) {
	return (
		<div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-1">
			{getRubricBands(criterion.maxScore, includeZero).map((band) => (
				<RubricBandCard
					band={band}
					criterion={criterion}
					key={`${criterion.id}-${band.range}`}
					selected={
						selectedScore !== undefined &&
						selectedScore >= band.min &&
						selectedScore <= band.max
					}
				/>
			))}
		</div>
	);
}

function StepActions({
	canSubmit,
	disabledSubmitLabel,
	isLastStep,
	isPending,
	onNext,
	onPrevious,
	onSubmit
}: {
	canSubmit: boolean;
	disabledSubmitLabel: string;
	isLastStep: boolean;
	isPending: boolean;
	onNext: () => void;
	onPrevious: () => void;
	onSubmit: () => void;
}) {
	return (
		<div className="flex flex-col gap-3 py-5 sm:flex-row sm:items-center sm:justify-between">
			<Button onClick={onPrevious} type="button" variant="outline">
				<ArrowLeftLine data-icon="inline-start" />
				Prev
			</Button>

			{isLastStep ? (
				<Button
					className="sm:min-w-[318px]"
					disabled={!canSubmit || isPending}
					onClick={onSubmit}
					type="button"
					variant={canSubmit ? "default" : "secondary"}
				>
					{isPending
						? "Submitting…"
						: canSubmit
							? "Submit score"
							: disabledSubmitLabel}
				</Button>
			) : (
				<Button onClick={onNext} type="button">
					Next
					<ArrowRightLine data-icon="inline-end" />
				</Button>
			)}
		</div>
	);
}

function MainCriterionStep({
	criterion,
	onScoreChange,
	score
}: {
	criterion: Criterion;
	onScoreChange: (criterionId: string, score: number) => void;
	score?: number;
}) {
	return (
		<div className="grid w-full gap-6 xl:grid-cols-[minmax(0,728px)_263px]">
			<section className="flex min-w-0 flex-col gap-8 xl:pr-4">
				<div className="flex flex-col gap-6">
					<h2 className="m-0 font-semibold text-[#1a1a1a] text-[28px] leading-9">
						{criterion.name}
					</h2>
					<p className="m-0 text-[#292929] text-base leading-6">
						{getCriterionDescription(criterion)}
					</p>
				</div>

				<div className="flex flex-col gap-3">
					<p className="m-0 font-medium text-[#434343] text-sm uppercase leading-5">
						Score
					</p>
					<ScoreButtonGroup
						criterion={criterion}
						includeZero={false}
						onChange={(value) => onScoreChange(criterion.id, value)}
						value={score}
					/>
				</div>

				<div className="xl:hidden">
					<RubricBandGrid
						criterion={criterion}
						includeZero={false}
						selectedScore={score}
					/>
				</div>
			</section>

			<aside className="hidden border-[#eceae5] border-l pl-4 xl:block">
				<RubricBandGrid
					criterion={criterion}
					includeZero={false}
					selectedScore={score}
				/>
			</aside>
		</div>
	);
}

function SidepotBadge({
	criterion,
	score
}: {
	criterion: Criterion;
	score?: number;
}) {
	const scored = score !== undefined;
	return (
		<Badge
			className={cn(
				"h-auto gap-1.5 rounded-full px-2 py-1 text-[11px]",
				scored
					? getScoreTone(score, criterion.maxScore)
					: "border-[#a5a5a5] bg-background text-foreground"
			)}
			variant="outline"
		>
			<span className="size-1.5 rounded-full bg-current" />
			<span className="font-medium">{criterion.name}</span>
			<Badge
				className={cn(
					"h-auto rounded-full px-2 py-px font-semibold text-[10px]",
					scored
						? getScoreFillClass(score, criterion.maxScore)
						: "bg-[#a5a5a5] text-white hover:bg-[#a5a5a5]"
				)}
			>
				{scored ? `${score}/${criterion.maxScore}` : `/${criterion.maxScore}`}
			</Badge>
		</Badge>
	);
}

function ScoreTile({
	criterion,
	score
}: {
	criterion: Criterion;
	score?: number;
}) {
	return (
		<div className="flex w-16 flex-col items-center gap-0.5 px-1 text-center">
			<p
				className={`m-0 font-medium text-base leading-6 ${
					score === undefined
						? "text-[#a5a5a5]"
						: getScoreTextColor(score, criterion.maxScore)
				}`}
			>
				{score ?? "–"}
			</p>
			<p className="m-0 truncate text-[#292929] text-[9px] uppercase leading-[14px]">
				{criterion.name}
			</p>
		</div>
	);
}

function ScoreSummaryCard({
	criteria,
	mainCriteria,
	scores,
	sidepotCriteria
}: {
	criteria: Criterion[];
	mainCriteria: Criterion[];
	scores: Record<string, number>;
	sidepotCriteria: Criterion[];
}) {
	return (
		<section className="rounded-[10px] bg-white px-3 py-4">
			<h3 className="m-0 font-medium text-base text-black leading-6">
				Score Summary
			</h3>
			<div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-center">
				<div className="flex flex-wrap gap-3">
					{sidepotCriteria.map((criterion) => (
						<SidepotBadge
							criterion={criterion}
							key={criterion.id}
							score={getDraftScore(scores, criterion.id)}
						/>
					))}
				</div>
				<div className="flex flex-1 flex-col gap-3 border-[#e6e6e6] border-t pt-3 lg:flex-row lg:items-center lg:border-t-0 lg:border-l lg:pt-0 lg:pl-4">
					<div className="flex flex-1 flex-wrap justify-between gap-2">
						{mainCriteria.map((criterion) => (
							<ScoreTile
								criterion={criterion}
								key={criterion.id}
								score={getDraftScore(scores, criterion.id)}
							/>
						))}
					</div>
					<div className="border-[#e6e6e6] border-t pt-2 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-4">
						<ScoreTotal criteria={criteria} scores={scores} />
					</div>
				</div>
			</div>
		</section>
	);
}

function SidepotCriterionCard({
	criterion,
	onScoreChange,
	score
}: {
	criterion: Criterion;
	onScoreChange: (criterionId: string, score: number) => void;
	score?: number;
}) {
	return (
		<article className="overflow-hidden rounded-xl border border-[#d6d6d6] bg-white">
			<header className="flex items-center justify-between border-[#f5f5f5] border-b bg-[#fcfcfc] px-5 py-4">
				<div className="flex items-center gap-2.5">
					<span className="size-2.5 rounded-full bg-[#ec1245]" />
					<div>
						<h3 className="m-0 font-medium text-[#1a1a1a] text-base leading-6">
							{criterion.name}
						</h3>
						<p className="m-0 text-[#a5a5a5] text-xs leading-4">Sidepot</p>
					</div>
				</div>
				<div className="text-right font-medium">
					{score === undefined ? (
						<p className="m-0 text-[#767676] text-[11px] leading-[14px]">
							Not yet scored
						</p>
					) : (
						<>
							<p className="m-0 text-[0px] text-black leading-none">
								<span className="text-[22px] leading-7">{score}</span>
								<span className="text-[#a5a5a5] text-sm leading-5">
									/{criterion.maxScore}
								</span>
							</p>
							<p className="m-0 text-[#434343] text-[9px] leading-[14px]">
								Scored
							</p>
						</>
					)}
				</div>
			</header>
			<div className="border-[#f5f5f5] border-b px-5 py-3">
				<p className="m-0 text-[#292929] text-xs leading-4 sm:text-sm sm:leading-5">
					{getCriterionDescription(criterion)}
				</p>
			</div>
			<div className="flex flex-col gap-4 p-4">
				<ScoreButtonGroup
					criterion={criterion}
					includeZero
					onChange={(value) => onScoreChange(criterion.id, value)}
					value={score}
				/>
				<RubricBandGrid
					criterion={criterion}
					includeZero
					selectedScore={score}
				/>
			</div>
		</article>
	);
}

function SidepotsStep({
	criteria,
	mainCriteria,
	onScoreChange,
	scores,
	sidepotCriteria
}: {
	criteria: Criterion[];
	mainCriteria: Criterion[];
	onScoreChange: (criterionId: string, score: number) => void;
	scores: Record<string, number>;
	sidepotCriteria: Criterion[];
}) {
	return (
		<section className="flex flex-col gap-6">
			<div className="flex flex-col gap-3">
				<h2 className="m-0 font-semibold text-[#1a1a1a] text-[28px] leading-9">
					Side pots
				</h2>
				<p className="m-0 text-[#292929] text-base leading-6">
					Please grade the side pots according to their own rubric.
				</p>
			</div>

			{sidepotCriteria.length > 0 ? (
				<div className="flex flex-col gap-4">
					{sidepotCriteria.map((criterion) => (
						<SidepotCriterionCard
							criterion={criterion}
							key={criterion.id}
							onScoreChange={onScoreChange}
							score={getDraftScore(scores, criterion.id)}
						/>
					))}
				</div>
			) : (
				<div className="rounded-2xl border border-[#d6d6d6] border-dashed bg-white p-8 text-center text-[#575757]">
					No sidepot criteria have been published for this event.
				</div>
			)}

			<ScoreSummaryCard
				criteria={criteria}
				mainCriteria={mainCriteria}
				scores={scores}
				sidepotCriteria={sidepotCriteria}
			/>
		</section>
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
			<div className="max-w-md rounded-2xl border border-[#d6d6d6] bg-white p-6 text-center shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
				<h1 className="m-0 font-semibold text-[28px] leading-9">{title}</h1>
				<p className="mt-3 mb-0 text-[#575757] text-base leading-6">
					{description}
				</p>
				<Link
					className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-[#7054fd] px-4 font-medium text-white transition hover:bg-[#6044ed]"
					href="/judge"
				>
					Back to dashboard
				</Link>
			</div>
		</div>
	);
}

export function JudgeScorePage({ assignmentId }: { assignmentId: string }) {
	const { userId } = useJudgeUser();
	const router = useRouter();
	const { confirm, dialog } = useConfirmDialog();
	const data = useJudgePortalData();
	const utils = api.useUtils();
	const assignment = data.assignments.find((item) => item.id === assignmentId);
	const scoresQuery = api.scores.getByAssignment.useQuery(
		{ assignmentId },
		{ enabled: Boolean(assignment) }
	);
	const createMany = api.scores.createMany.useMutation();
	const [activeStep, setActiveStep] = useState(0);
	const [draftScores, setDraftScores] = useState<Record<string, number>>({});
	const [draftDirty, setDraftDirty] = useState(false);
	const [message, setMessage] = useState("");

	const criteria = data.criteria;
	const mainCriteria = useMemo(
		() => criteria.filter((criterion) => !criterion.isSidepot),
		[criteria]
	);
	const sidepotCriteria = useMemo(
		() => criteria.filter((criterion) => criterion.isSidepot),
		[criteria]
	);
	const hasSidepotStep = sidepotCriteria.length > 0;
	const totalSteps = mainCriteria.length + (hasSidepotStep ? 1 : 0);
	const requiredCriteria = criteria;
	const selectedCount = requiredCriteria.filter((criterion) =>
		hasDraftScore(draftScores, criterion.id)
	).length;
	const selectedSidepotCount = sidepotCriteria.filter((criterion) =>
		hasDraftScore(draftScores, criterion.id)
	).length;
	const allScoresSelected =
		requiredCriteria.length > 0 && selectedCount === requiredCriteria.length;
	const disabledSubmitLabel =
		sidepotCriteria.length > 0 && selectedSidepotCount < sidepotCriteria.length
			? `Score all side pots to submit (${selectedSidepotCount} of ${sidepotCriteria.length} done)`
			: `Score all criteria to submit (${selectedCount} of ${requiredCriteria.length} done)`;
	const activeCriterion =
		activeStep < mainCriteria.length ? mainCriteria[activeStep] : undefined;
	const isLastStep = totalSteps === 0 || activeStep >= totalSteps - 1;

	useEffect(() => {
		if (!(assignment && !draftDirty)) return;
		const nextScores: Record<string, number> = {};
		for (const score of scoresQuery.data ?? assignment.scores) {
			nextScores[score.criteriaId] = score.value;
		}
		setDraftScores(nextScores);
	}, [assignment, draftDirty, scoresQuery.data]);

	const updateScore = (criterionId: string, score: number) => {
		setDraftDirty(true);
		setDraftScores((current) => ({ ...current, [criterionId]: score }));
	};

	const submitScores = async () => {
		if (!(assignment && allScoresSelected)) return;
		setMessage("");

		try {
			await createMany.mutateAsync(
				requiredCriteria.map((criterion) => ({
					assignmentId: assignment.id,
					criteriaId: criterion.id,
					score: draftScores[criterion.id] ?? 0
				}))
			);
			await Promise.all([
				utils.scores.getByAssignment.invalidate({
					assignmentId: assignment.id
				}),
				utils.scores.getByRound.invalidate({
					roundId: assignment.room.round.id
				}),
				utils.judgingAssignments.getByJudge.invalidate({ judgeId: userId })
			]);
			router.push("/judge");
		} catch (error) {
			setMessage(
				error instanceof Error ? error.message : "Scores could not be saved."
			);
		}
	};

	if (data.error) {
		return (
			<ScorePageMessage
				description={`Judging data could not be loaded: ${data.error.message}`}
				title="Unable to load scoring"
			/>
		);
	}

	if (data.isLoading) {
		return <LoadingCard label="Loading scoring workspace…" />;
	}

	if (!assignment) {
		return (
			<ScorePageMessage
				description="This assignment could not be found for your judging account."
				title="Assignment unavailable"
			/>
		);
	}

	if (criteria.length === 0) {
		return (
			<ScorePageMessage
				description="No judging criteria have been published yet."
				title="No criteria available"
			/>
		);
	}

	return (
		<div className="min-h-screen bg-[#fcfcfc]">
			{dialog}
			<ScoreTopBar
				activeStep={activeStep}
				assignment={assignment}
				criteria={criteria}
				mainCriteria={mainCriteria}
				scores={draftScores}
				sidepotCriteria={sidepotCriteria}
			/>
			<div className="mx-auto flex w-full max-w-[1071px] flex-col gap-6 px-4 py-6 sm:px-8 lg:px-6">
				{activeCriterion ? (
					<MainCriterionStep
						criterion={activeCriterion}
						onScoreChange={updateScore}
						score={getDraftScore(draftScores, activeCriterion.id)}
					/>
				) : (
					<SidepotsStep
						criteria={criteria}
						mainCriteria={mainCriteria}
						onScoreChange={updateScore}
						scores={draftScores}
						sidepotCriteria={sidepotCriteria}
					/>
				)}

				{message ? (
					<p className="m-0 rounded-xl bg-red-50 px-4 py-3 text-red-700 text-sm">
						{message}
					</p>
				) : null}

				<StepActions
					canSubmit={allScoresSelected}
					disabledSubmitLabel={disabledSubmitLabel}
					isLastStep={isLastStep}
					isPending={createMany.isPending}
					onNext={() =>
						setActiveStep((current) => Math.min(current + 1, totalSteps - 1))
					}
					onPrevious={async () => {
						if (activeStep === 0) {
							if (
								draftDirty &&
								!(await confirm({
									title: "Leave scoring?",
									description:
										"You have unsaved score changes that will be lost.",
									confirmLabel: "Leave",
									destructive: true
								}))
							) {
								return;
							}
							router.push("/judge");
						} else {
							setActiveStep((current) => Math.max(0, current - 1));
						}
					}}
					onSubmit={submitScores}
				/>
			</div>
		</div>
	);
}
