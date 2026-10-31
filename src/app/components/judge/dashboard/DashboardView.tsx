"use client";

import PageHeader from "@/app/components/PageHeader";
import { Card } from "@/app/components/ui/card";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyTitle
} from "@/app/components/ui/empty";
import { useCurrentTime } from "@/hooks/use-current-time";
import { formatTime } from "@/lib/datetime";
import { cn } from "@/lib/utils";
import {
	type Criterion,
	getJudgeTable,
	isAssignmentScored,
	type JudgeAssignment,
	type ScheduleItem,
	sortAssignments,
	withBreaks
} from "../judgePortal";
import { JudgeTableCard } from "./JudgeTableCard";
import { JudgeTeamRow } from "./JudgeTeamRow";

type Round = JudgeAssignment["table"]["round"];

type RoundGroup = {
	round: Round;
	assignments: JudgeAssignment[];
	scoredCount: number;
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
			scoredCount: 0
		};
		group.assignments.push(assignment);
		if (isAssignmentScored(assignment, criteria)) group.scoredCount++;
		groups.set(round.id, group);
	}
	return Array.from(groups.values()).sort(
		(a, b) => a.round.startTime.getTime() - b.round.startTime.getTime()
	);
}

function isIncomplete(group: RoundGroup) {
	return group.scoredCount < group.assignments.length;
}

// The round the judge should be working on: the active round while it has
// teams left, else the first round with teams left, else the active or last one.
function getCurrentGroup(groups: RoundGroup[], activeRoundId: string | null) {
	const active = groups.find((group) => group.round.id === activeRoundId);
	if (active && isIncomplete(active)) return active;

	const incomplete = groups.find(isIncomplete);
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

function NoAssignments() {
	return (
		<Empty>
			<EmptyHeader>
				<EmptyTitle>No teams assigned yet</EmptyTitle>
				<EmptyDescription>
					Your assigned teams will appear here once the schedule is set.
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
	criteria
}: {
	userId: string;
	userName: string;
	activeRoundId: string | null;
	assignments: JudgeAssignment[];
	criteria: Criterion[];
}) {
	const currentTime = useCurrentTime();
	const groups = groupByRound(assignments, criteria);
	const currentGroup = getCurrentGroup(groups, activeRoundId);
	const table = currentGroup && getJudgeTable(currentGroup.assignments, userId);

	return (
		<div className="flex flex-col gap-6">
			<PageHeader
				description="Score each team once their presentation starts."
				title={`Hi, ${userName}!`}
			/>
			{currentGroup && table && (
				<JudgeTableCard roundName={currentGroup.round.name} table={table} />
			)}
			<div className="flex flex-col gap-12">
				{groups.length === 0 && <NoAssignments />}
				{groups.map((group) => (
					<RoundSection
						criteria={criteria}
						currentTime={currentTime}
						group={group}
						key={group.round.id}
					/>
				))}
			</div>
		</div>
	);
}
