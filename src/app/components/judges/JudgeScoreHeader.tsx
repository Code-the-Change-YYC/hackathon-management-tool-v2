"use client";
import Link from "next/link";
import { Badge } from "@/app/components/ui/badge";
import { cn } from "@/lib/utils";
import { ScoreTotal } from "./JudgeScoreSummary";
import {
	type Criterion,
	formatTime,
	getDraftScore,
	getScoreTone,
	getTeamCode,
	hasDraftScore,
	type JudgeAssignment
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
							? "border-transparent bg-purple-50 text-auth-focus hover:bg-purple-50"
							: "text-grey-400"
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
				className="h-auto rounded-full px-3 py-1 text-base text-grey-400 leading-6"
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

export function JudgeScoreHeader({
	onLeave,
	activeStep,
	assignment,
	criteria,
	mainCriteria,
	scores,
	sidepotCriteria
}: {
	activeStep: number;
	onLeave: () => Promise<void>;
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
		<header className="border-grey-300 border-b bg-[#fafafa] px-6 py-4 sm:px-8">
			<nav className="mb-3 flex items-center gap-1 text-xs leading-4">
				<Link
					className="text-grey-400 transition hover:text-grey-600"
					href="/judge"
					onClick={(event) => {
						event.preventDefault();
						void onLeave();
					}}
				>
					Dashboard
				</Link>
				<span className="text-grey-400">/</span>
				<span className="font-medium text-[#ec1245]">Score</span>
			</nav>
			<div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
				<div className="flex min-w-0 flex-1 flex-col gap-4 lg:flex-row lg:items-center">
					<div className="min-w-43">
						<h1 className="m-0 truncate font-semibold text-base text-black leading-6">
							{assignment.team.name}
						</h1>
						<div className="mt-0 flex flex-wrap items-center gap-1 text-[11px] text-auth-placeholder leading-4">
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
