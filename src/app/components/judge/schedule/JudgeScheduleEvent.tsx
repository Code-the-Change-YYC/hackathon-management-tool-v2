import { differenceInMinutes } from "date-fns";
import Link from "next/link";
import { Badge } from "@/app/components/ui/badge";
import { Skeleton } from "@/app/components/ui/skeleton";
import {
	type Criterion,
	formatDuration,
	getAssignmentRoomName,
	getAssignmentTotal,
	getTeamCode,
	isAssignmentScored,
	type JudgeAssignment
} from "../judgePortal";

export function JudgeScheduleEvent({
	assignment,
	criteria,
	duration,
	currentTime
}: {
	assignment: JudgeAssignment;
	criteria: Criterion[];
	duration: number;
	currentTime: Date;
}) {
	const scored = isAssignmentScored(assignment, criteria);
	const total = getAssignmentTotal(assignment, criteria);
	const minutesUntil = assignment.timeSlot
		? differenceInMinutes(assignment.timeSlot, currentTime, {
				roundingMethod: "ceil"
			})
		: null;
	let status = "Unscheduled";
	if (minutesUntil !== null) {
		status =
			minutesUntil > 0 ? `In ${formatDuration(minutesUntil)}` : "Started";
	}
	if (scored) status = "Scored";

	return (
		<Link
			className="flex min-w-0 flex-wrap items-start gap-4 rounded-xl border border-border bg-card p-4 text-card-foreground transition hover:border-primary focus-visible:outline-2 focus-visible:outline-primary"
			href={`/judge/score/${assignment.id}`}
		>
			<div className="flex shrink-0 flex-col items-start gap-2 border-border border-r pr-4">
				<Badge variant="accent">{assignment.room.round.name}</Badge>
				<span className="text-muted-foreground text-xs">{status}</span>
			</div>
			<div className="min-w-0 flex-1 basis-40">
				<h3 className="m-0 break-words font-medium">{assignment.team.name}</h3>
				<div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-muted-foreground text-xs">
					<span>Team ID: {getTeamCode(assignment)}</span>
					<span>Estimated {formatDuration(duration)}</span>
					<span>{getAssignmentRoomName(assignment)}</span>
				</div>
			</div>
			{scored && (
				<p className="m-0 font-medium tabular-nums">
					<span className="sr-only">Score: </span>
					{total.max ? `${total.total}/${total.max}` : total.total}
				</p>
			)}
		</Link>
	);
}

export function JudgeScheduleEventSkeleton() {
	return (
		<div className="flex min-w-0 flex-wrap items-start gap-4 rounded-xl border border-border bg-card p-4">
			<div className="flex shrink-0 flex-col items-start gap-2 border-border border-r pr-4">
				<Skeleton className="h-5 w-24 rounded-4xl" />
				<Skeleton className="my-0.5 h-3 w-16" />
			</div>
			<div className="flex min-w-0 flex-1 basis-40 flex-col gap-2">
				<Skeleton className="my-1 h-4 w-40" />
				<Skeleton className="my-0.5 h-3 w-64 max-w-full" />
			</div>
		</div>
	);
}
