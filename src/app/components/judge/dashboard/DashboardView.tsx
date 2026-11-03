"use client";

import Link from "next/link";
import PageHeader from "@/app/components/PageHeader";
import { buttonVariants } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyTitle
} from "@/app/components/ui/empty";
import { useCurrentTime } from "@/hooks/use-current-time";
import { formatTime } from "@/lib/datetime";
import { getBallotPlaces } from "@/lib/judging";
import { cn } from "@/lib/utils";
import {
	type Criterion,
	getJudgeTable,
	getRankingState,
	hasSubmittedBallot,
	isAssignmentScored,
	type JudgeAssignment,
	type ScheduleItem,
	sortAssignments,
	withBreaks
} from "../judgePortal";
import { JudgeTableCard } from "./JudgeTableCard";
import { FinalistRow, JudgeTeamRow } from "./JudgeTeamRow";

type Round = JudgeAssignment["table"]["round"];

type RoundGroup = {
	round: Round;
	assignments: JudgeAssignment[];
	scoredCount: number;
	// Every team is scored, or the finalists are ranked.
	complete: boolean;
};

function groupByRound(
	assignments: JudgeAssignment[],
	criteria: Criterion[]
): RoundGroup[] {
	const groups = new Map<string, RoundGroup>();
	for (const assignment of assignments.slice().sort(sortAssignments)) {
		const round = assignment.table.round;
		const group = groups.get(round.id) ?? {
			round,
			assignments: [],
			scoredCount: 0,
			complete: false
		};
		group.assignments.push(assignment);
		if (isAssignmentScored(assignment, criteria)) group.scoredCount++;
		groups.set(round.id, group);
	}
	for (const group of groups.values()) {
		group.complete =
			group.round.kind === "final"
				? hasSubmittedBallot(group.assignments)
				: group.scoredCount === group.assignments.length;
	}
	return Array.from(groups.values()).sort(
		(a, b) => a.round.startTime.getTime() - b.round.startTime.getTime()
	);
}

// The round the judge should be working on: the active round while it has
// teams left, else the first round with teams left, else the active or last one.
function getCurrentGroup(groups: RoundGroup[], activeRoundId: string | null) {
	const active = groups.find((group) => group.round.id === activeRoundId);
	if (active && !active.complete) return active;

	const incomplete = groups.find((group) => !group.complete);
	if (incomplete) return incomplete;

	return active ?? groups.at(-1);
}

function RoundProgress({
	assignments,
	criteria
}: {
	assignments: JudgeAssignment[];
	criteria: Criterion[];
}) {
	return (
		<div aria-hidden className="flex gap-1.5">
			{assignments.map((assignment) => (
				<span
					className={cn(
						"h-2 flex-1 rounded-full bg-grey-200 transition-colors",
						isAssignmentScored(assignment, criteria) && "bg-primary"
					)}
					key={assignment.id}
				/>
			))}
		</div>
	);
}

function BreakRow({
	item
}: {
	item: Extract<ScheduleItem, { kind: "break" }>;
}) {
	return (
		<li className="flex min-h-12 items-center gap-4 bg-muted/50 px-4 py-2 text-muted-foreground text-sm sm:px-6">
			<span className="w-16 shrink-0 whitespace-nowrap sm:w-20">
				{formatTime(item.startsAt)}
			</span>
			<span>Break until {formatTime(item.endsAt)}</span>
		</li>
	);
}

function RoundSection({
	group,
	criteria,
	currentTime
}: {
	group: RoundGroup;
	criteria: Criterion[];
	currentTime: Date;
}) {
	const titleId = `round-${group.round.id}-title`;

	return (
		<section aria-labelledby={titleId} className="flex flex-col gap-3">
			<div className="flex flex-wrap items-baseline justify-between gap-2">
				<h2 className="m-0 font-medium text-xl" id={titleId}>
					{group.round.name}
				</h2>
				<p className="m-0 text-muted-foreground text-sm">
					{group.scoredCount} of {group.assignments.length} scored
				</p>
			</div>
			<RoundProgress assignments={group.assignments} criteria={criteria} />
			<Card className="py-0">
				<ul className="m-0 list-none divide-y divide-grey-200 p-0">
					{withBreaks(group.assignments).map((item) => {
						if (item.kind === "break") {
							return (
								<BreakRow
									item={item}
									key={`break-${item.startsAt.getTime()}`}
								/>
							);
						}
						return (
							<JudgeTeamRow
								assignment={item.assignment}
								criteria={criteria}
								currentTime={currentTime}
								key={item.assignment.id}
							/>
						);
					})}
				</ul>
			</Card>
		</section>
	);
}

function BallotCard({
	group,
	currentTime,
	scoresReleased
}: {
	group: RoundGroup;
	currentTime: Date;
	scoresReleased: boolean;
}) {
	const state = getRankingState(group.round, currentTime, scoresReleased);
	const submitted = group.complete;
	const places = getBallotPlaces(group.assignments.length);
	const description = {
		upcoming: `Ranking opens at ${formatTime(group.round.startTime)}, when the final round starts.`,
		open: submitted
			? "You can change your ranking until the winners are announced."
			: `After the last presentation, pick your ${places} favourite teams in order.`,
		closed: "Ranking closed when the winners were announced."
	}[state];

	return (
		<Card className="flex-row flex-wrap items-center gap-x-6 gap-y-4 px-4 py-4 sm:px-6">
			<div className="flex min-w-0 flex-1 flex-col gap-1">
				<h3 className="m-0 font-medium text-lg">
					{submitted ? "Your ranking is in" : `Rank your top ${places}`}
				</h3>
				<p className="m-0 text-muted-foreground text-sm">{description}</p>
			</div>
			{state === "open" && (
				<Link
					className={buttonVariants({
						variant: submitted ? "outline" : "default"
					})}
					href="/judge/rank"
				>
					{submitted ? "Change ranking" : "Rank finalists"}
				</Link>
			)}
		</Card>
	);
}

function FinalRoundSection({
	group,
	currentTime,
	scoresReleased
}: {
	group: RoundGroup;
	currentTime: Date;
	scoresReleased: boolean;
}) {
	const titleId = `round-${group.round.id}-title`;

	return (
		<section aria-labelledby={titleId} className="flex flex-col gap-3">
			<div className="flex flex-wrap items-baseline justify-between gap-2">
				<h2 className="m-0 font-medium text-xl" id={titleId}>
					{group.round.name}
				</h2>
				<p className="m-0 text-muted-foreground text-sm">
					{group.complete ? "Ranking submitted" : "Not ranked yet"}
				</p>
			</div>
			<Card className="py-0">
				<ul className="m-0 list-none divide-y divide-grey-200 p-0">
					{group.assignments.map((assignment) => (
						<FinalistRow
							assignment={assignment}
							currentTime={currentTime}
							key={assignment.id}
						/>
					))}
				</ul>
			</Card>
			<BallotCard
				currentTime={currentTime}
				group={group}
				scoresReleased={scoresReleased}
			/>
		</section>
	);
}

function NoAssignments() {
	return (
		<Empty>
			<EmptyHeader>
				<EmptyTitle>No teams assigned yet</EmptyTitle>
				<EmptyDescription>
					Your assigned teams will appear here once the schedule is published.
				</EmptyDescription>
			</EmptyHeader>
		</Empty>
	);
}

export function DashboardView({
	userId,
	userName,
	activeRoundId,
	assignments,
	criteria,
	scoresReleased
}: {
	userId: string;
	userName: string;
	activeRoundId: string | null;
	assignments: JudgeAssignment[];
	criteria: Criterion[];
	scoresReleased: boolean;
}) {
	const currentTime = useCurrentTime();
	const groups = groupByRound(assignments, criteria);
	const currentGroup = getCurrentGroup(groups, activeRoundId);
	const table = currentGroup && getJudgeTable(currentGroup.assignments, userId);

	return (
		<div className="flex flex-col gap-6">
			<PageHeader
				description="Score each team after their presentation, then rank the finalists."
				title={`Hi, ${userName}!`}
			/>
			{currentGroup && table && (
				<JudgeTableCard roundName={currentGroup.round.name} table={table} />
			)}
			<div className="flex flex-col gap-12">
				{groups.length === 0 && <NoAssignments />}
				{groups.map((group) =>
					group.round.kind === "final" ? (
						<FinalRoundSection
							currentTime={currentTime}
							group={group}
							key={group.round.id}
							scoresReleased={scoresReleased}
						/>
					) : (
						<RoundSection
							criteria={criteria}
							currentTime={currentTime}
							group={group}
							key={group.round.id}
						/>
					)
				)}
			</div>
		</div>
	);
}
