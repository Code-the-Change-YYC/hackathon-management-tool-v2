import { differenceInMinutes } from "date-fns";
import Link from "next/link";
import { type ReactNode, useId } from "react";
import { Button, buttonVariants } from "@/app/components/ui/button";
import { Skeleton } from "@/app/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
	type Criterion,
	canScoreAssignment,
	formatDuration,
	formatTime,
	getAssignmentRoomName,
	getAssignmentScoreStatus,
	getAssignmentTotal,
	getTeamCode,
	isAssignmentScored,
	type JudgeAssignment
} from "../judgePortal";

export function JudgeScheduleEvent({
	assignment,
	criteria,
	currentTime,
	highlighted = false
}: {
	assignment: JudgeAssignment;
	criteria: Criterion[];
	currentTime: Date;
	highlighted?: boolean;
}) {
	const timingId = useId();
	const scored = isAssignmentScored(assignment, criteria);
	const scoreStatus = getAssignmentScoreStatus(assignment, criteria);
	const canScore = canScoreAssignment(assignment, criteria, currentTime);
	const total = getAssignmentTotal(assignment, criteria);
	const minutesUntil = assignment.timeSlot
		? differenceInMinutes(assignment.timeSlot, currentTime, {
				roundingMethod: "ceil"
			})
		: null;
	const timing =
		minutesUntil === null
			? "Time not assigned"
			: minutesUntil > 0
				? `In ${formatDuration(minutesUntil)}`
				: "Scheduled time reached";
	const action = scored
		? "Edit scores"
		: scoreStatus === "Partially scored"
			? "Continue scoring"
			: "Score team";

	return (
		<article
			aria-label={`${assignment.team.name} · ${assignment.room.round.name}`}
			className={cn(
				"grid min-w-0 @min-[720px]/schedule:grid-cols-(--schedule-columns) grid-cols-[minmax(0,1fr)_auto] @min-[720px]/schedule:items-center gap-x-4 gap-y-3 px-4 py-3",
				highlighted && "bg-muted/50"
			)}
		>
			<div className="min-w-0">
				{assignment.timeSlot ? (
					<time
						className="font-medium text-sm tabular-nums"
						dateTime={assignment.timeSlot.toISOString()}
					>
						{formatTime(assignment.timeSlot)}
					</time>
				) : (
					<span className="text-muted-foreground text-sm">Unscheduled</span>
				)}
				<p className="mt-1 mb-0 text-muted-foreground text-xs" id={timingId}>
					{timing}
					{!canScore ? (
						<span className="sr-only">
							. Scoring opens at the scheduled time.
						</span>
					) : null}
				</p>
			</div>
			<div className="@min-[720px]/schedule:col-span-1 col-span-2 @min-[720px]/schedule:row-start-auto row-start-2 min-w-0">
				<h3 className="wrap-break-word m-0 font-medium text-sm">
					{assignment.team.name}
				</h3>
				<p className="wrap-break-word mt-1 mb-0 text-muted-foreground text-xs">
					Team ID: {getTeamCode(assignment)}
				</p>
			</div>
			<div className="wrap-break-word min-w-0 text-sm">
				<span className="sr-only">Room: </span>
				{getAssignmentRoomName(assignment)}
			</div>
			<div className="@min-[720px]/schedule:col-start-auto col-start-2 @min-[720px]/schedule:row-start-auto row-start-1 min-w-0 @min-[720px]/schedule:text-left text-right">
				<span
					className={cn(
						"text-sm",
						scored ? "text-judging-success-foreground" : "text-muted-foreground"
					)}
				>
					{scoreStatus}
				</span>
				{scored && total.max > 0 ? (
					<p className="mt-1 mb-0 text-muted-foreground text-xs tabular-nums">
						Main score: {total.total}/{total.max}
					</p>
				) : null}
			</div>
			<div className="@min-[720px]/schedule:col-start-auto col-start-2 @min-[720px]/schedule:row-start-auto row-start-3 flex justify-end">
				{canScore ? (
					<Link
						aria-label={`${action} for ${assignment.team.name}`}
						className={buttonVariants({ variant: "outline", size: "sm" })}
						href={`/judge/score/${assignment.id}`}
					>
						{action}
					</Link>
				) : (
					<Button
						aria-describedby={timingId}
						aria-label={`${action} for ${assignment.team.name}`}
						disabled
						size="sm"
						variant="outline"
					>
						{assignment.timeSlot
							? `Opens at ${formatTime(assignment.timeSlot)}`
							: action}
					</Button>
				)}
			</div>
		</article>
	);
}

export function ScheduleTable({ children }: { children: ReactNode }) {
	return (
		<div className="@container/schedule overflow-hidden rounded-lg border border-border [--schedule-columns:100px_minmax(0,1fr)_90px_140px_156px]">
			<div
				aria-hidden="true"
				className="@min-[720px]/schedule:grid hidden grid-cols-(--schedule-columns) gap-4 border-border border-b px-4 py-3 text-muted-foreground text-xs"
			>
				<span>Time</span>
				<span>Team</span>
				<span>Room</span>
				<span>Scores</span>
				<span className="text-right">Action</span>
			</div>
			{children}
		</div>
	);
}

export function JudgeScheduleEventSkeleton() {
	return (
		<div className="grid min-w-0 @min-[720px]/schedule:grid-cols-(--schedule-columns) grid-cols-[minmax(0,1fr)_auto] @min-[720px]/schedule:items-center gap-x-4 gap-y-3 border-border border-b px-4 py-3 last:border-b-0">
			<div className="flex min-w-0 flex-col">
				<Skeleton className="my-0.5 h-4 w-16" />
				<div className="mt-1 flex flex-col">
					<Skeleton className="my-0.5 h-3 w-20" />
					<Skeleton className="my-0.5 @min-[720px]/schedule:block hidden h-3 w-12" />
				</div>
			</div>
			<div className="@min-[720px]/schedule:col-span-1 col-span-2 @min-[720px]/schedule:row-start-auto row-start-2 flex min-w-0 flex-col">
				<Skeleton className="my-0.5 h-4 w-40 max-w-full" />
				<Skeleton className="mt-1.5 mb-0.5 h-3 w-24" />
			</div>
			<Skeleton className="my-0.5 h-4 w-16" />
			<div className="@min-[720px]/schedule:col-start-auto col-start-2 @min-[720px]/schedule:row-start-auto row-start-1 flex min-w-0 @min-[720px]/schedule:justify-start justify-end">
				<Skeleton className="my-0.5 h-4 w-24" />
			</div>
			<div className="@min-[720px]/schedule:col-start-auto col-start-2 @min-[720px]/schedule:row-start-auto row-start-3 flex justify-end">
				<Skeleton className="h-9 w-28" />
			</div>
		</div>
	);
}
