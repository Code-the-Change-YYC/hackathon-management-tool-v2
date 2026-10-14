"use client";

import {
	ArrowRightLine,
	CheckLine,
	FileCheckLine,
	XlsLine
} from "@mingcute/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent } from "@/app/components/ui/card";
import { Skeleton } from "@/app/components/ui/skeleton";
import {
	JUDGING_PHASE_LABELS,
	JUDGING_PHASES,
	type JudgingPhase
} from "@/lib/judging";
import { countdownParts, formatDashboardDate } from "@/lib/participant-events";
import { type JudgingRound, judgingStages } from "@/lib/participant-judging";
import { cn, range } from "@/lib/utils";

// Ticks every second, unlike the shared useCurrentTime, so the seconds tile stays live.
function useSecondTick() {
	const [now, setNow] = useState(() => new Date());
	useEffect(() => {
		const interval = window.setInterval(() => setNow(new Date()), 1000);
		return () => window.clearInterval(interval);
	}, []);
	return now;
}

export function SubmissionCountdown({
	deadline,
	startDate
}: {
	deadline: Date | null;
	startDate: Date | null;
}) {
	const now = useSecondTick();
	const beforeStart = !!startDate && now < startDate;
	const target = beforeStart ? startDate : deadline;
	const expired = !!target && now >= target;
	const parts = target ? countdownParts(target, now) : null;
	return (
		<section
			aria-labelledby="countdown-title"
			className="flex min-w-0 flex-col gap-4"
		>
			<div className="flex flex-col gap-1">
				<h2 className="font-medium text-xl" id="countdown-title">
					{expired
						? "Submissions closed"
						: `Time until submission ${beforeStart ? "opens" : "closes"}`}
				</h2>
				<p className="text-grey-600 text-sm/5">
					{target
						? `Submissions ${beforeStart ? "open" : "close"} on ${formatDashboardDate(target, true)}`
						: "The submission deadline will be announced soon."}
				</p>
			</div>
			{parts && (
				// The server renders a few seconds earlier than hydration, so the
				// ticking values can't match.
				<div
					aria-label={
						expired
							? "Submissions closed"
							: `${parts[0]} days, ${parts[1]} hours, ${parts[2]} minutes, ${parts[3]} seconds remaining`
					}
					className="flex justify-between gap-1 px-2 py-3 tabular-nums"
					role="timer"
					suppressHydrationWarning
				>
					{parts.map((value, index) => (
						<div
							className="flex min-w-0 flex-1 items-start justify-between gap-1"
							key={["Days", "Hours", "Minutes", "Seconds"][index]}
						>
							<div className="flex min-w-0 flex-1 flex-col items-center">
								<span
									className="text-[32px]/11 sm:text-4xl/11"
									suppressHydrationWarning
								>
									{String(value).padStart(2, "0")}
								</span>
								<span className="font-medium text-[11px]/4 uppercase">
									{["Days", "Hours", "Minutes", "Seconds"][index]}
								</span>
							</div>
							{index < 3 && (
								<span aria-hidden className="text-[32px]/11">
									:
								</span>
							)}
						</div>
					))}
				</div>
			)}
		</section>
	);
}

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
			<section
				aria-labelledby="judging-title"
				className="flex min-w-0 flex-col gap-6"
			>
				<h2 className="font-medium text-xl" id="judging-title">
					Judging Status
				</h2>
				{!["judging", "review", "winners_announced"].includes(phase) && (
					<p aria-live="polite" className="text-grey-600 text-sm/5">
						{JUDGING_PHASE_LABELS[phase]}
					</p>
				)}
				<Card>
					<CardContent>
						<ol
							aria-label="Judging phases"
							className="relative flex flex-col gap-4"
						>
							{judgingStages(phase, rounds, currentRoundId).map(
								(stage, index, stages) => (
									<li
										aria-current={
											stage.state === "current" ? "step" : undefined
										}
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
			</section>
		);
	const milestones = JUDGING_PHASES.filter((value) => value !== "not_started");
	const current = JUDGING_PHASES.indexOf(phase) - 1;
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
			<div className="px-4 pt-5">
				<ol aria-label="Judging phases" className="flex items-center">
					{milestones.map((milestone, index) => (
						<li
							aria-current={index === current ? "step" : undefined}
							className={cn(
								"relative flex items-center",
								index < milestones.length - 1 ? "flex-1" : "flex-none"
							)}
							key={milestone}
						>
							<span
								className={cn(
									"size-3 shrink-0 rounded-full",
									index <= current ? "bg-purple-500" : "bg-grey-300"
								)}
								title={`${JUDGING_PHASE_LABELS[milestone]}${index < current ? " (completed)" : index === current ? " (current)" : " (upcoming)"}`}
							>
								<span className="sr-only">
									{JUDGING_PHASE_LABELS[milestone]}:{" "}
									{index < current
										? "completed"
										: index === current
											? "current"
											: "upcoming"}
								</span>
							</span>
							{index < milestones.length - 1 && (
								<span
									aria-hidden
									className={cn(
										"h-1 flex-1",
										index < current ? "bg-purple-500" : "bg-grey-300"
									)}
								/>
							)}
						</li>
					))}
				</ol>
				<div
					aria-hidden
					className="-mx-4 mt-4 flex justify-between text-center text-[11px]/4 text-grey-600"
				>
					<div className="flex w-18 flex-col items-center gap-1">
						<XlsLine className="size-6" />
						Submissions
						<br />
						close
					</div>
					<div className="flex w-18 flex-col items-center gap-1">
						<FileCheckLine className="size-6" />
						Winners
						<br />
						announced
					</div>
				</div>
			</div>
		</section>
	);
}

export function SubmissionCountdownSkeleton() {
	return (
		<div className="flex min-w-0 flex-col gap-4">
			<div className="flex flex-col gap-1">
				<Skeleton className="my-1 h-5 w-3/4" />
				<Skeleton className="my-1 h-3 w-1/2" />
			</div>
			<div className="flex justify-between gap-4 px-2 py-3">
				{range(4).map((index) => (
					<div className="flex flex-1 flex-col items-center gap-1" key={index}>
						<Skeleton className="my-0.5 h-9 w-12" />
						<Skeleton className="my-0.5 h-3 w-10" />
					</div>
				))}
			</div>
		</div>
	);
}

export function JudgingStatusSkeleton({
	variant = "compact"
}: {
	variant?: "compact" | "detailed";
}) {
	if (variant === "detailed")
		return (
			<div className="flex min-w-0 flex-col gap-6">
				<h2 className="font-medium text-xl">Judging Status</h2>
				<Skeleton className="my-1 h-3 w-40" />
				<Card>
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
			</div>
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
			<div className="flex flex-col gap-4 px-4 pt-5">
				<Skeleton className="h-3 w-full rounded-full" />
				<div className="-mx-4 flex justify-between">
					<Skeleton className="h-16 w-18" />
					<Skeleton className="h-16 w-18" />
				</div>
			</div>
		</div>
	);
}
