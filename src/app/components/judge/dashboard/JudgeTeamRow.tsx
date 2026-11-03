import { RightLine } from "@mingcute/react";
import Link from "next/link";
import { Skeleton } from "@/app/components/ui/skeleton";
import { formatPlace } from "@/lib/judging";
import { cn } from "@/lib/utils";
import {
	type Criterion,
	formatTime,
	getAssignmentScoreStatus,
	getAssignmentTotal,
	getBallotPlace,
	getSlotStatus,
	getTeamCode,
	isPresenting,
	isScoringOpen,
	type JudgeAssignment
} from "../judgePortal";

const rowClass = "flex min-h-20 items-center gap-2 px-4 py-3 sm:px-6";
// Scored rows sit on the primary colour, so muted text needs a light tint.
const mutedClass =
	"text-muted-foreground group-data-[state=scored]:text-primary-foreground/80";

type RowState = "scored" | "partial" | "open" | "upcoming" | "closed";

function getRowState(
	assignment: JudgeAssignment,
	criteria: Criterion[],
	currentTime: Date,
	scoresReleased: boolean
): RowState {
	const status = getAssignmentScoreStatus(assignment, criteria);
	if (status === "Scores recorded") return "scored";
	// Released scores are published, so unfinished scorecards stay unfinished.
	if (scoresReleased) return "closed";
	// A criterion added after submission leaves a scorecard partly filled in.
	if (status === "Partially scored") return "partial";
	if (isScoringOpen(assignment, currentTime)) return "open";
	return "upcoming";
}

const LINK_LABELS: Record<Exclude<RowState, "upcoming" | "closed">, string> = {
	scored: "Edit score for",
	partial: "Continue scoring",
	open: "Score"
};

function RowStatus({
	state,
	assignment,
	criteria,
	currentTime
}: {
	state: RowState;
	assignment: JudgeAssignment;
	criteria: Criterion[];
	currentTime: Date;
}) {
	switch (state) {
		case "scored": {
			const { total, max } = getAssignmentTotal(assignment, criteria);
			return (
				<span className="shrink-0 tabular-nums">
					<span className="font-semibold text-xl">{total}</span>
					{max > 0 && <span className={cn(mutedClass, "text-xs")}>/{max}</span>}
				</span>
			);
		}
		case "partial":
			return (
				<span className="flex shrink-0 flex-col items-end">
					<span className="flex items-center gap-1 font-medium text-primary">
						Continue <RightLine className="size-4" />
					</span>
					<span className="text-muted-foreground text-xs">
						Partially scored
					</span>
				</span>
			);
		case "open":
			return (
				<span className="flex shrink-0 items-center gap-0.5 font-medium text-primary">
					Score <RightLine className="size-5" />
				</span>
			);
		case "upcoming":
			return (
				<span className="shrink-0 text-muted-foreground text-sm">
					{getSlotStatus(assignment.startsAt, currentTime)}
				</span>
			);
		case "closed":
			return (
				<span className="shrink-0 text-muted-foreground text-sm">
					Scoring closed
				</span>
			);
	}
}

export function JudgeTeamRow({
	assignment,
	criteria,
	currentTime,
	scoresReleased
}: {
	assignment: JudgeAssignment;
	criteria: Criterion[];
	currentTime: Date;
	scoresReleased: boolean;
}) {
	const state = getRowState(assignment, criteria, currentTime, scoresReleased);

	const content = (
		<>
			<span
				className={cn(
					mutedClass,
					"w-16 shrink-0 whitespace-nowrap text-sm sm:w-20"
				)}
			>
				{formatTime(assignment.startsAt)}
			</span>
			<span className="flex min-w-0 flex-1 flex-col">
				<span className="wrap-break-word font-medium text-base sm:text-lg">
					{assignment.team.name}
				</span>
				<span className={cn(mutedClass, "text-sm tracking-wider")}>
					{getTeamCode(assignment)}
				</span>
			</span>
			<RowStatus
				assignment={assignment}
				criteria={criteria}
				currentTime={currentTime}
				state={state}
			/>
		</>
	);

	const rowBackground = cn(
		"group",
		isPresenting(assignment, currentTime) && "bg-purple-50",
		state === "scored" && "bg-primary text-primary-foreground"
	);

	if (state === "upcoming" || state === "closed" || scoresReleased) {
		return (
			<li className={rowBackground} data-state={state}>
				<div className={rowClass}>{content}</div>
			</li>
		);
	}

	return (
		<li className={rowBackground} data-state={state}>
			<Link
				aria-label={`${LINK_LABELS[state]} ${assignment.team.name}`}
				className={cn(
					rowClass,
					"focus-visible:-outline-offset-2 transition hover:bg-muted/30 focus-visible:outline-2 focus-visible:outline-primary",
					"group-data-[state=scored]:focus-visible:outline-primary-foreground group-data-[state=scored]:hover:bg-primary-foreground/10"
				)}
				href={`/judge/score/${assignment.id}`}
			>
				{content}
			</Link>
		</li>
	);
}

// Finalists are ranked from the ballot card, so their rows don't link anywhere.
export function FinalistRow({
	assignment,
	currentTime
}: {
	assignment: JudgeAssignment;
	currentTime: Date;
}) {
	const place = getBallotPlace(assignment);

	return (
		<li
			className={cn(
				rowClass,
				isPresenting(assignment, currentTime) && "bg-purple-50"
			)}
		>
			<span className="w-16 shrink-0 whitespace-nowrap text-muted-foreground text-sm sm:w-20">
				{formatTime(assignment.startsAt)}
			</span>
			<span className="flex min-w-0 flex-1 flex-col">
				<span className="wrap-break-word font-medium text-base sm:text-lg">
					{assignment.team.name}
				</span>
				<span className="text-muted-foreground text-sm tracking-wider">
					{getTeamCode(assignment)}
				</span>
			</span>
			{place ? (
				<span className="shrink-0 font-semibold text-primary">
					{formatPlace(place)}
				</span>
			) : assignment.startsAt <= currentTime ? null : (
				<span className="shrink-0 text-muted-foreground text-sm">
					{getSlotStatus(assignment.startsAt, currentTime)}
				</span>
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
