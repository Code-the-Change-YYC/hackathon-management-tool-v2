"use client";

import { ArrowRightLine } from "@mingcute/react";
import Link from "next/link";
import { buttonVariants } from "@/app/components/ui/button";
import { Skeleton } from "@/app/components/ui/skeleton";
import {
	type JudgingProgress,
	type JudgingStage,
	judgingStages
} from "@/lib/participant-judging";
import { cn, range } from "@/lib/utils";

function statusLabel(stages: JudgingStage[]) {
	const current = stages.find((stage) => stage.state === "current");
	if (current?.id === "submissions") return "Submissions open";
	if (current) return current.name;
	const completed = stages.filter((stage) => stage.state === "completed");
	if (completed.length === stages.length) return "Winners announced";
	const lastCompleted = completed.at(-1);
	return lastCompleted
		? `${lastCompleted.name} complete`
		: "Judging hasn’t started";
}

function stepLabel(stages: JudgingStage[]) {
	const currentIndex = stages.findIndex((stage) => stage.state === "current");
	const completedCount = stages.filter(
		(stage) => stage.state === "completed"
	).length;
	const step = currentIndex >= 0 ? currentIndex + 1 : completedCount;
	return step > 0 ? `Step ${step} of ${stages.length}` : "Not started";
}

export function JudgingStatus({
	progress,
	now
}: {
	progress: JudgingProgress;
	now: Date;
}) {
	const stages = judgingStages(progress, now);
	const currentIndex = stages.findIndex((stage) => stage.state === "current");
	const next = stages.find(
		(stage, index) => index > currentIndex && stage.state === "upcoming"
	);

	return (
		<section
			aria-labelledby="judging-title"
			className="flex min-w-0 flex-col gap-4"
		>
			<div className="flex flex-col gap-1">
				<div className="flex flex-wrap items-center justify-between gap-1">
					<h2 className="font-medium text-xl" id="judging-title">
						Judging Status
					</h2>
					<Link
						className={buttonVariants({ size: "sm", variant: "ghost" })}
						href="/participant/judging"
					>
						View judging info
						<ArrowRightLine className="size-5" data-icon="inline-end" />
					</Link>
				</div>
				<p aria-live="polite" className="text-grey-600 text-sm/5">
					{statusLabel(stages)}
				</p>
			</div>
			<div className="flex flex-col gap-3">
				<ol aria-label="Judging phases" className="flex gap-1.5">
					{stages.map((stage) => (
						<li
							aria-current={stage.state === "current" ? "step" : undefined}
							className={cn(
								"h-2 flex-1 rounded-full",
								stage.state === "upcoming" ? "bg-grey-200" : "bg-primary"
							)}
							key={stage.id}
							title={stage.name}
						>
							<span className="sr-only">
								{stage.name}: {stage.state}
							</span>
						</li>
					))}
				</ol>
				<div
					aria-hidden
					className="flex flex-wrap justify-between gap-x-4 gap-y-1 font-medium text-grey-600 text-xs/4"
				>
					<span>{stepLabel(stages)}</span>
					{next && <span>Next: {next.name}</span>}
				</div>
			</div>
		</section>
	);
}

// Submissions, pre-screening, two rounds and winners.
const SKELETON_STAGES = 5;

export function JudgingStatusSkeleton() {
	return (
		<div className="flex min-w-0 flex-col gap-4">
			<div className="flex flex-col gap-1">
				<div className="flex flex-wrap items-center justify-between gap-1">
					<h2 className="font-medium text-xl">Judging Status</h2>
					<Skeleton className="h-9 w-40" />
				</div>
				<Skeleton className="my-1 h-3 w-40" />
			</div>
			<div className="flex flex-col gap-3">
				<div className="flex gap-1.5">
					{range(SKELETON_STAGES).map((index) => (
						<Skeleton className="h-2 flex-1 rounded-full" key={index} />
					))}
				</div>
				<div className="flex justify-between">
					<Skeleton className="h-4 w-20" />
					<Skeleton className="h-4 w-32" />
				</div>
			</div>
		</div>
	);
}
