"use client";

import { CheckFill } from "@mingcute/react";
import { Card, CardContent, CardHeader } from "@/app/components/ui/card";
import { Skeleton } from "@/app/components/ui/skeleton";
import {
	type JudgingProgress,
	type JudgingStageState,
	judgingStages
} from "@/lib/participant-judging";
import { cn, range } from "@/lib/utils";

function StageMarker({ state }: { state: JudgingStageState }) {
	if (state === "completed")
		return (
			<span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary">
				<CheckFill aria-hidden className="size-3" color="white" />
			</span>
		);
	if (state === "current")
		return (
			<span className="flex size-6 shrink-0 items-center justify-center rounded-full border-2 border-primary bg-white ring-4 ring-primary/15" />
		);
	return (
		<span className="size-6 shrink-0 rounded-full border-2 border-grey-300 bg-white" />
	);
}

export function JudgingTimeline({
	progress,
	now
}: {
	progress: JudgingProgress;
	now: Date;
}) {
	const stages = judgingStages(progress, now);

	return (
		<Card className="min-w-0">
			<CardHeader>
				<h2 className="font-medium text-xl">Judging Status</h2>
			</CardHeader>
			<CardContent>
				<ol aria-label="Judging phases" className="flex flex-col">
					{stages.map((stage, index) => {
						const next = stages[index + 1];
						return (
							<li
								aria-current={stage.state === "current" ? "step" : undefined}
								className="flex gap-4"
								key={stage.id}
							>
								<div className="flex flex-col items-center">
									<StageMarker state={stage.state} />
									{next && (
										<span
											aria-hidden
											className={cn(
												"my-1.5 w-0.5 flex-1 rounded-full",
												next.state === "upcoming" ? "bg-grey-200" : "bg-primary"
											)}
										/>
									)}
								</div>
								<div
									className={cn(
										"flex min-w-0 flex-1 flex-col gap-1",
										next && "pb-8"
									)}
								>
									<span
										className={cn(
											"font-medium text-base/6",
											stage.state === "upcoming" && "text-grey-600"
										)}
									>
										{stage.name}
									</span>
									<p className="text-grey-600 text-sm/5">{stage.description}</p>
								</div>
							</li>
						);
					})}
				</ol>
			</CardContent>
		</Card>
	);
}

// Submissions, pre-screening, two rounds and winners.
const SKELETON_STAGES = 5;

export function JudgingTimelineSkeleton() {
	return (
		<Card className="min-w-0">
			<CardHeader>
				<h2 className="font-medium text-xl">Judging Status</h2>
			</CardHeader>
			<CardContent>
				<div className="flex flex-col">
					{range(SKELETON_STAGES).map((index) => {
						const isLast = index === SKELETON_STAGES - 1;
						return (
							<div className="flex gap-4" key={index}>
								<div className="flex flex-col items-center">
									<Skeleton className="size-6 shrink-0 rounded-full" />
									{!isLast && (
										<Skeleton className="my-1.5 w-0.5 flex-1 rounded-full" />
									)}
								</div>
								<div
									className={cn(
										"flex min-w-0 flex-1 flex-col gap-1",
										!isLast && "pb-8"
									)}
								>
									<Skeleton className="my-1 h-4 w-48 max-w-full" />
									<Skeleton className="my-1 h-3 w-3/4" />
								</div>
							</div>
						);
					})}
				</div>
			</CardContent>
		</Card>
	);
}
