"use client";

import { ArrowRightLine, CheckLine } from "@mingcute/react";
import Link from "next/link";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardHeader } from "@/app/components/ui/card";
import { Skeleton } from "@/app/components/ui/skeleton";
import {
	JUDGING_PHASE_LABELS,
	JUDGING_PHASES,
	type JudgingPhase
} from "@/lib/judging";
import { type JudgingRound, judgingStages } from "@/lib/participant-judging";
import { cn, range } from "@/lib/utils";

export function JudgingStatus({
	phase,
	roundName,
	variant = "compact",
	rounds = [],
	currentRoundId = null
}: {
	phase: JudgingPhase;
	roundName?: string;
	variant?: "compact" | "detailed";
	rounds?: JudgingRound[];
	currentRoundId?: string | null;
}) {
	if (variant === "detailed")
		return (
			<Card className="min-w-0">
				<CardHeader>
					<h2 className="font-medium text-xl">Judging Status</h2>
					{!["judging", "review", "winners_announced"].includes(phase) && (
						<p aria-live="polite" className="text-grey-600 text-sm/5">
							{JUDGING_PHASE_LABELS[phase]}
						</p>
					)}
				</CardHeader>
				<CardContent>
					<ol
						aria-label="Judging phases"
						className="relative flex flex-col gap-4"
					>
						{judgingStages(phase, rounds, currentRoundId).map(
							(stage, index, stages) => (
								<li
									aria-current={stage.state === "current" ? "step" : undefined}
									className="relative flex min-h-20 items-start gap-6 py-3"
									key={stage.id}
								>
									{index < stages.length - 1 && (
										<span
											aria-hidden
											className="-bottom-7 absolute top-9 left-[11.5px] w-px bg-grey-300"
										/>
									)}
									<span
										className={cn(
											"relative flex size-6 shrink-0 items-center justify-center rounded-full",
											stage.state === "completed"
												? "bg-[#04b38f]"
												: cn(
														"border-2 bg-white",
														stage.state === "current"
															? "border-purple-500"
															: "border-grey-300"
													)
										)}
									>
										{stage.state === "completed" ? (
											<CheckLine aria-hidden className="size-4 text-white" />
										) : stage.state === "current" ? (
											<span
												aria-hidden
												className="size-3 rounded-full bg-purple-500"
											/>
										) : null}
									</span>
									<div className="flex min-w-0 flex-1 flex-col gap-2">
										<div className="flex flex-wrap items-center gap-x-4 gap-y-1">
											<span className="font-medium text-base/6">
												{stage.name}
											</span>
											<span
												className={cn(
													"rounded px-2 font-medium text-[11px]/4 uppercase",
													stage.state === "completed"
														? "bg-[#d1fff2] text-[#006c53]"
														: stage.state === "current"
															? "bg-purple-100 text-purple-800"
															: "bg-grey-100 text-grey-600"
												)}
											>
												{stage.state === "current" ? "Ongoing" : stage.state}
											</span>
										</div>
										<p className="font-medium text-grey-600 text-xs/4">
											{stage.id === "submissions"
												? "Submit your project before the configured deadline to take part in judging."
												: stage.id === "review"
													? "Projects are reviewed before proceeding to live judging."
													: stage.id === "winners"
														? "Results will be published once judging and deliberation are complete."
														: "Prepare a short project demonstration for your team’s assigned judging time."}
										</p>
									</div>
								</li>
							)
						)}
					</ol>
				</CardContent>
			</Card>
		);
	const milestones = JUDGING_PHASES.filter((value) => value !== "not_started");
	const current = JUDGING_PHASES.indexOf(phase) - 1;
	const next = milestones[current + 1];
	const label =
		phase === "judging" && roundName
			? `Judging: ${roundName}`
			: JUDGING_PHASE_LABELS[phase];
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
					<Button
						nativeButton={false}
						render={
							<Link href="/participant/judging">
								View judging info
								<ArrowRightLine className="size-5" data-icon="inline-end" />
							</Link>
						}
						size="sm"
						variant="ghost"
					/>
				</div>
				<p aria-live="polite" className="text-grey-600 text-sm/5">
					{label}
				</p>
			</div>
			<div className="flex flex-col gap-3">
				<ol aria-label="Judging phases" className="flex gap-1.5">
					{milestones.map((milestone, index) => (
						<li
							aria-current={index === current ? "step" : undefined}
							className={cn(
								"h-2 flex-1 rounded-full",
								index <= current ? "bg-purple-500" : "bg-grey-200"
							)}
							key={milestone}
							title={JUDGING_PHASE_LABELS[milestone]}
						>
							<span className="sr-only">
								{JUDGING_PHASE_LABELS[milestone]}:{" "}
								{index < current
									? "completed"
									: index === current
										? "current"
										: "upcoming"}
							</span>
						</li>
					))}
				</ol>
				<div
					aria-hidden
					className="flex flex-wrap justify-between gap-x-4 gap-y-1 font-medium text-grey-600 text-xs/4"
				>
					<span>
						{current < 0
							? "Not started"
							: `Step ${current + 1} of ${milestones.length}`}
					</span>
					{next && <span>Next: {JUDGING_PHASE_LABELS[next]}</span>}
				</div>
			</div>
		</section>
	);
}

export function JudgingStatusSkeleton({
	variant = "compact"
}: {
	variant?: "compact" | "detailed";
}) {
	if (variant === "detailed")
		return (
			<Card className="min-w-0">
				<CardHeader>
					<h2 className="font-medium text-xl">Judging Status</h2>
					<Skeleton className="my-1 h-3 w-40" />
				</CardHeader>
				<CardContent className="flex flex-col gap-4">
					{range(5).map((index) => (
						<div className="flex min-h-20 items-start gap-6 py-3" key={index}>
							<Skeleton className="size-6 shrink-0 rounded-full" />
							<div className="flex min-w-0 flex-1 flex-col gap-2">
								<Skeleton className="my-1 h-4 w-48 max-w-full" />
								<Skeleton className="my-0.5 h-3 w-3/4" />
							</div>
						</div>
					))}
				</CardContent>
			</Card>
		);
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
					{range(6).map((index) => (
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
