"use client";

import Link from "next/link";
import PageHeader from "@/app/components/PageHeader";
import { Badge } from "@/app/components/ui/badge";
import { Button, buttonVariants } from "@/app/components/ui/button";
import { Card, CardContent, CardHeader } from "@/app/components/ui/card";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyTitle
} from "@/app/components/ui/empty";
import { Spinner } from "@/app/components/ui/spinner";
import { useCurrentTime } from "@/hooks/use-current-time";
import { useRefresh } from "@/hooks/use-refresh";
import { formatDateKey, formatDateTime } from "@/lib/datetime";
import {
	type Criterion,
	getAssignmentRoomName,
	type JudgeAssignment
} from "../judgePortal";
import { JudgeScheduleEvent, ScheduleTable } from "./JudgeScheduleEvent";
import {
	getScheduleRounds,
	getScheduleSummary,
	groupScheduleByDate
} from "./judgeSchedule";

type RoundScheduleProps = {
	assignments: JudgeAssignment[];
	criteria: Criterion[];
	currentTime: Date;
	round: JudgeAssignment["room"]["round"];
};

function ScheduleRows({
	assignments,
	criteria,
	currentTime,
	highlightedId
}: Omit<RoundScheduleProps, "round"> & { highlightedId?: string }) {
	return (
		<ScheduleTable>
			<ol className="m-0 list-none p-0">
				{assignments.map((assignment) => (
					<li
						className="border-border border-b last:border-b-0"
						key={assignment.id}
					>
						<JudgeScheduleEvent
							assignment={assignment}
							criteria={criteria}
							currentTime={currentTime}
							highlighted={assignment.id === highlightedId}
						/>
					</li>
				))}
			</ol>
		</ScheduleTable>
	);
}

function RoundSchedule({
	assignments,
	criteria,
	currentTime,
	round
}: RoundScheduleProps) {
	if (assignments.length === 0) {
		return (
			<Empty className="border border-border">
				<EmptyHeader>
					<EmptyTitle>No judging assignments yet</EmptyTitle>
					<EmptyDescription>
						You have no assignments in this round.
					</EmptyDescription>
				</EmptyHeader>
			</Empty>
		);
	}

	const summary = getScheduleSummary(
		assignments,
		criteria,
		round.id,
		currentTime
	);
	const featured = summary.nextScheduled ?? summary.needsScoring;
	const groups = groupScheduleByDate(assignments);
	const unscheduled = assignments.filter((assignment) => !assignment.timeSlot);
	const rows = {
		criteria,
		currentTime,
		highlightedId: summary.needsScoring?.id
	};
	const scoringAction = summary.needsScoring ? (
		<Link
			aria-label={`Open scorecard for ${summary.needsScoring.team.name}`}
			className={buttonVariants({ size: "sm" })}
			href={`/judge/score/${summary.needsScoring.id}`}
		>
			Open scorecard
		</Link>
	) : null;

	return (
		<div className="flex flex-col gap-6">
			<section
				aria-label={`${round.name} overview`}
				className="flex flex-col gap-3 rounded-lg bg-muted/50 px-4 py-3"
			>
				<div className="flex flex-wrap items-center justify-between gap-3">
					{featured ? (
						<p className="wrap-break-word m-0 min-w-0 text-sm">
							<span className="font-medium">
								{summary.nextScheduled ? "Next scheduled" : "Needs scoring"}:{" "}
								{featured.team.name}
							</span>
							<span className="mt-1 block text-muted-foreground">
								{featured.timeSlot
									? formatDateTime(featured.timeSlot)
									: "Time not assigned"}{" "}
								· {getAssignmentRoomName(featured)}
							</span>
						</p>
					) : (
						<p className="m-0 text-sm">
							All assigned teams in this round have scores recorded.
						</p>
					)}
					<div className="flex flex-wrap items-center gap-3">
						<p className="m-0 text-muted-foreground text-sm">
							{summary.outstandingCount} scorecard
							{summary.outstandingCount === 1 ? "" : "s"} remaining
						</p>
						{!summary.nextScheduled ? scoringAction : null}
					</div>
				</div>
				{summary.needsScoring && summary.nextScheduled && (
					<div className="flex flex-wrap items-center justify-between gap-3">
						<p className="wrap-break-word m-0 min-w-0 text-sm">
							Needs scoring:{" "}
							<span className="font-medium">
								{summary.needsScoring.team.name}
							</span>{" "}
							· {getAssignmentRoomName(summary.needsScoring)}
						</p>
						{scoringAction}
					</div>
				)}
			</section>
			{groups.map((group) => {
				const time = group[0]?.timeSlot;
				if (!time) return null;
				return (
					<section className="flex flex-col gap-3" key={formatDateKey(time)}>
						<ScheduleRows assignments={group} {...rows} />
					</section>
				);
			})}
			{unscheduled.length > 0 && (
				<section className="flex flex-col gap-3">
					<div>
						<h3 className="m-0 font-medium text-base">Awaiting scheduling</h3>
						<p className="mt-1 mb-0 text-muted-foreground text-sm">
							Presentation times have not been set for these teams.
						</p>
					</div>
					<ScheduleRows assignments={unscheduled} {...rows} />
				</section>
			)}
		</div>
	);
}

export function ScheduleView({
	assignments,
	criteria,
	rounds: allRounds,
	activeRoundId,
	updatedAt
}: {
	assignments: JudgeAssignment[];
	criteria: Criterion[];
	rounds: JudgeAssignment["room"]["round"][];
	activeRoundId: string | null;
	updatedAt: number;
}) {
	const { isRefreshing, refresh } = useRefresh();
	const currentTime = useCurrentTime();
	const rounds = getScheduleRounds(allRounds, assignments);

	return (
		<div className="mx-auto flex w-full min-w-0 max-w-6xl flex-col gap-6">
			<div className="flex flex-wrap items-start justify-between gap-4">
				<PageHeader
					description="Your teams, presentation times, and scorecards."
					title="Judging Schedule"
				/>
				<div className="flex flex-col items-start gap-2 sm:items-end">
					<Button
						aria-label={
							isRefreshing ? "Refreshing schedule" : "Refresh schedule"
						}
						disabled={isRefreshing}
						onClick={() => refresh()}
						size="sm"
						variant="outline"
					>
						{isRefreshing ? <Spinner data-icon="inline-start" /> : null}
						{isRefreshing ? "Refreshing…" : "Refresh"}
					</Button>
					{updatedAt ? (
						<p className="m-0 text-muted-foreground text-xs">
							Updated {formatDateTime(updatedAt)} · Calgary time
						</p>
					) : null}
				</div>
			</div>
			{rounds.length > 0 ? (
				rounds.map((round) => {
					const roundAssignments = assignments.filter(
						(assignment) => assignment.room.roundId === round.id
					);
					return (
						<Card
							aria-labelledby={`round-${round.id}-title`}
							className="min-w-0"
							key={round.id}
							role="region"
						>
							<CardHeader className="flex flex-wrap items-center gap-x-3 gap-y-1">
								<h2
									className="font-medium text-xl"
									id={`round-${round.id}-title`}
								>
									{round.name}
								</h2>
								{round.id === activeRoundId && (
									<Badge variant="accent">Active</Badge>
								)}
								<span className="text-muted-foreground text-sm tabular-nums">
									{roundAssignments.length} team
									{roundAssignments.length === 1 ? "" : "s"}
								</span>
							</CardHeader>
							<CardContent>
								<RoundSchedule
									assignments={roundAssignments}
									criteria={criteria}
									currentTime={currentTime}
									round={round}
								/>
							</CardContent>
						</Card>
					);
				})
			) : (
				<Empty className="border border-border">
					<EmptyHeader>
						<EmptyTitle>No judging assignments yet</EmptyTitle>
						<EmptyDescription>
							Your teams will appear here once an organizer assigns them.
						</EmptyDescription>
					</EmptyHeader>
				</Empty>
			)}
		</div>
	);
}
