import { ArrowRightLine, CheckCircleLine } from "@mingcute/react";
import Link from "next/link";
import { Button, buttonVariants } from "@/app/components/ui/button";
import { Card, CardContent } from "@/app/components/ui/card";
import { Skeleton } from "@/app/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
	formatTime,
	getSlotStatus,
	getTeamCode,
	isScoringOpen,
	type JudgeAssignment
} from "../judgePortal";

export function JudgeNextTeam({
	assignment,
	currentTime,
	teamCount
}: {
	assignment?: JudgeAssignment;
	currentTime: Date;
	teamCount: number;
}) {
	if (!assignment) {
		return (
			<Card className="bg-judging-success-muted">
				<CardContent className="flex items-center gap-3">
					<CheckCircleLine className="size-8 shrink-0 text-judging-success-foreground" />
					<div>
						<h2 className="m-0 font-medium text-judging-success-foreground text-lg">
							All {teamCount} teams scored
						</h2>
						<p className="m-0 text-muted-foreground">
							You can still edit any score below.
						</p>
					</div>
				</CardContent>
			</Card>
		);
	}

	const open = isScoringOpen(assignment, currentTime);
	const buttonClass = "w-full sm:w-auto";

	return (
		<Card className="border border-purple-500 bg-purple-50">
			<CardContent className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
				<div className="flex min-w-0 flex-col gap-1">
					<p className="m-0 font-medium text-purple-800 text-sm uppercase">
						Up next
					</p>
					<h2 className="m-0 break-words font-semibold text-2xl md:text-3xl">
						{assignment.team.name}
					</h2>
					<p className="m-0 text-muted-foreground">
						Team ID {getTeamCode(assignment)} ·{" "}
						{assignment.timeSlot
							? `${formatTime(assignment.timeSlot)} · ${getSlotStatus(assignment.timeSlot, currentTime)}`
							: "Unscheduled"}
					</p>
				</div>
				{open ? (
					<Link
						className={cn(buttonVariants({ size: "lg" }), buttonClass)}
						href={`/judge/score/${assignment.id}`}
					>
						Score {assignment.team.name}
						<ArrowRightLine data-icon="inline-end" />
					</Link>
				) : (
					<Button
						className={buttonClass}
						disabled
						size="lg"
						variant="secondary"
					>
						Opens at {formatTime(assignment.timeSlot)}
					</Button>
				)}
			</CardContent>
		</Card>
	);
}

export function JudgeNextTeamSkeleton() {
	return (
		<Card>
			<CardContent className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
				<div className="flex flex-col gap-2">
					<Skeleton className="h-4 w-16" />
					<Skeleton className="h-8 w-56" />
					<Skeleton className="h-4 w-48" />
				</div>
				<Skeleton className="h-14 w-full sm:w-52" />
			</CardContent>
		</Card>
	);
}
