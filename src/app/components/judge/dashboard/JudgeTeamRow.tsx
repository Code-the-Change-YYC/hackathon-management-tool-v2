import { RightLine } from "@mingcute/react";
import Link from "next/link";
import { Skeleton } from "@/app/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
	type Criterion,
	formatTime,
	getAssignmentCriteria,
	getAssignmentScoreStatus,
	getAssignmentTotal,
	getCriteriaScore,
	getSlotStatus,
	getTeamCode,
	isPresenting,
	isScoringOpen,
	type JudgeAssignment,
	sortCriteria
} from "../judgePortal";

const rowClass = "flex min-h-16 items-center gap-4 px-4 py-3 sm:px-6";

export function JudgeTeamRow({
	assignment,
	criteria,
	currentTime
}: {
	assignment: JudgeAssignment;
	criteria: Criterion[];
	currentTime: Date;
}) {
	const status = getAssignmentScoreStatus(assignment, criteria);
	const scored = status === "Scores recorded";
	// A criterion added after submission leaves a scorecard partly filled in.
	const partial = status === "Partially scored";
	const open = scored || partial || isScoringOpen(assignment, currentTime);
	const presenting = isPresenting(assignment, currentTime);
	const total = getAssignmentTotal(assignment, criteria);
	const breakdown = getAssignmentCriteria(assignment, criteria)
		.sort(sortCriteria)
		.flatMap((criterion) => {
			const value = getCriteriaScore(assignment, criterion.id);
			if (value === undefined) return [];
			return criterion.isSidepot
				? `${criterion.name} ${value}/${criterion.maxScore}`
				: `${criterion.name} ${value}`;
		});

	const content = (
		<>
			<span className="w-16 shrink-0 text-muted-foreground text-sm sm:w-20">
				{formatTime(assignment.startsAt)}
			</span>
			<span className="flex min-w-0 flex-1 flex-col">
				<span className="break-words font-medium text-base">
					{assignment.team.name}
				</span>
				<span className="text-muted-foreground text-xs">
					Team ID {getTeamCode(assignment)}
					{presenting ? (
						<span className="font-medium text-primary"> · Presenting now</span>
					) : null}
				</span>
				{scored && breakdown.length > 0 && (
					<span className="hidden text-muted-foreground text-xs sm:block">
						{breakdown.join(" · ")}
					</span>
				)}
			</span>
			{scored ? (
				<span className="flex shrink-0 flex-col items-end">
					<span className="tabular-nums">
						<strong className="text-lg">{total.total}</strong>
						{total.max > 0 && (
							<span className="text-muted-foreground">/{total.max}</span>
						)}
					</span>
					<span className="font-medium text-judging-success text-xs">
						Scored · Edit
					</span>
				</span>
			) : partial ? (
				<span className="flex shrink-0 flex-col items-end">
					<span className="flex items-center gap-1 font-medium text-primary">
						Continue <RightLine className="size-4" />
					</span>
					<span className="text-muted-foreground text-xs">
						Partially scored
					</span>
				</span>
			) : open ? (
				<span className="flex shrink-0 items-center gap-1 font-medium text-primary">
					Score <RightLine className="size-4" />
				</span>
			) : (
				<span className="shrink-0 text-muted-foreground text-sm">
					{getSlotStatus(assignment.startsAt, currentTime)}
				</span>
			)}
		</>
	);

	return (
		<li className={cn(presenting && "bg-purple-50")}>
			{open ? (
				<Link
					aria-label={`${scored ? "Edit score for" : partial ? "Continue scoring" : "Score"} ${assignment.team.name}`}
					className={cn(
						rowClass,
						"focus-visible:-outline-offset-2 transition hover:bg-purple-50 focus-visible:outline-2 focus-visible:outline-primary"
					)}
					href={`/judge/score/${assignment.id}`}
				>
					{content}
				</Link>
			) : (
				<div className={rowClass}>{content}</div>
			)}
		</li>
	);
}

export function JudgeTeamRowSkeleton() {
	return (
		<li className={rowClass}>
			<Skeleton className="h-4 w-16" />
			<span className="flex flex-1 flex-col gap-1">
				<Skeleton className="h-4 w-40" />
				<Skeleton className="h-3 w-20" />
			</span>
			<Skeleton className="h-5 w-12" />
		</li>
	);
}
