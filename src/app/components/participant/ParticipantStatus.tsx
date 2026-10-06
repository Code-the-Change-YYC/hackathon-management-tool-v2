"use client";

import { ArrowRightLine, FileCheckLine, XlsLine } from "@mingcute/react";
import Link from "next/link";
import { buttonVariants } from "@/app/components/ui/button";
import { useCurrentTime } from "@/hooks/use-current-time";
import {
	JUDGING_PHASE_LABELS,
	JUDGING_PHASES,
	type JudgingPhase
} from "@/lib/judging";
import { countdownParts, formatDashboardDate } from "@/lib/participant-events";
import { cn } from "@/lib/utils";

export function SubmissionCountdown({
	deadline,
	startDate,
	timeZone
}: {
	deadline: Date | null;
	startDate: Date | null;
	timeZone: string;
}) {
	const now = useCurrentTime(1000);
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
				<h2 className="font-medium text-[22px]/7" id="countdown-title">
					{expired
						? "Submissions closed"
						: `Time until submission ${beforeStart ? "opens" : "closes"}`}
				</h2>
				<p className="text-grey-600 text-sm/5">
					{target
						? `Submissions ${beforeStart ? "open" : "close"} on ${formatDashboardDate(target, timeZone, true)}`
						: "The submission deadline will be announced soon."}
				</p>
			</div>
			{parts && (
				<div
					aria-label={
						expired
							? "Submissions closed"
							: `${parts[0]} days, ${parts[1]} hours, ${parts[2]} minutes, ${parts[3]} seconds remaining`
					}
					className="flex justify-between gap-1 px-2 py-3 tabular-nums"
					role="timer"
				>
					{parts.map((value, index) => (
						<div
							className="flex min-w-0 flex-1 items-start justify-between gap-1"
							key={["Days", "Hours", "Minutes", "Seconds"][index]}
						>
							<div className="flex min-w-0 flex-1 flex-col items-center">
								<span className="text-[32px]/11 sm:text-4xl/11">
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
	roundName
}: {
	phase: JudgingPhase;
	roundName?: string;
}) {
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
					<h2 className="font-medium text-[22px]/7" id="judging-title">
						Judging Status
					</h2>
					<Link
						className={cn(
							buttonVariants({ variant: "ghost" }),
							"h-8 gap-1 rounded-full px-1 text-sm has-data-[icon=inline-end]:pr-1 [&_svg:not([class*='size-'])]:size-5"
						)}
						href="/participant/judging"
					>
						View judging info
						<ArrowRightLine data-icon="inline-end" />
					</Link>
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
