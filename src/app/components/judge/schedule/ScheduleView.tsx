"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import PageHeader from "@/app/components/PageHeader";
import { Badge } from "@/app/components/ui/badge";
import { Button, buttonVariants } from "@/app/components/ui/button";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyTitle
} from "@/app/components/ui/empty";
import { Spinner } from "@/app/components/ui/spinner";
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger
} from "@/app/components/ui/tabs";
import { useCurrentTime } from "@/hooks/use-current-time";
import { useRefresh } from "@/hooks/use-refresh";
import { formatDateKey, formatDateTime } from "@/lib/datetime";
import {
	type Criterion,
	formatDate,
	getAssignmentRoomName,
	type JudgeAssignment
} from "../judgePortal";
import { JudgeScheduleEvent } from "./JudgeScheduleEvent";
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
		</div>
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
						<p className="m-0 min-w-0 break-words text-sm">
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
				{summary.needsScoring && summary.nextScheduled ? (
					<div className="flex flex-wrap items-center justify-between gap-3">
						<p className="m-0 min-w-0 break-words text-sm">
							Needs scoring:{" "}
							<span className="font-medium">
								{summary.needsScoring.team.name}
							</span>{" "}
							· {getAssignmentRoomName(summary.needsScoring)}
						</p>
						{scoringAction}
					</div>
				) : null}
			</section>
			{groups.map((group) => {
				const time = group[0]?.timeSlot;
				if (!time) return null;
				return (
					<section className="flex flex-col gap-3" key={formatDateKey(time)}>
						<h2 className="m-0 font-medium text-base">{formatDate(time)}</h2>
						<ScheduleRows assignments={group} {...rows} />
					</section>
				);
			})}
			{unscheduled.length > 0 ? (
				<section className="flex flex-col gap-3">
					<div>
						<h2 className="m-0 font-medium text-base">Awaiting scheduling</h2>
						<p className="mt-1 mb-0 text-muted-foreground text-sm">
							Presentation times have not been set for these teams.
						</p>
					</div>
					<ScheduleRows assignments={unscheduled} {...rows} />
				</section>
			) : null}
		</div>
	);
}

export function ScheduleView({
	assignments,
	criteria,
	rounds: allRounds,
	activeRoundId,
	updatedAt,
	initialRoundId
}: {
	assignments: JudgeAssignment[];
	criteria: Criterion[];
	rounds: JudgeAssignment["room"]["round"][];
	activeRoundId: string | null;
	updatedAt: number;
	initialRoundId?: string;
}) {
	const router = useRouter();
	const { isRefreshing, refresh } = useRefresh();
	const currentTime = useCurrentTime();
	const [selectedRoundId, setSelectedRoundId] = useState<string | null>(
		initialRoundId ?? null
	);
	const rounds = getScheduleRounds(allRounds, assignments);
	const selectedRound =
		rounds.find((round) => round.id === selectedRoundId) ??
		rounds.find((round) => round.id === activeRoundId) ??
		rounds[0];
	const resolvedRoundId = selectedRound?.id ?? null;
	// Remember the initial choice once async data arrives, and recover if it is removed.
	useEffect(() => {
		if (selectedRoundId !== resolvedRoundId)
			setSelectedRoundId(resolvedRoundId);
	}, [resolvedRoundId, selectedRoundId]);

	return (
		<div className="mx-auto flex w-full min-w-0 max-w-6xl flex-col gap-5">
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
			{selectedRound ? (
				<>
					{!activeRoundId ? (
						<p className="m-0 text-muted-foreground text-sm">
							No active round selected. You can review your assignments in each
							round.
						</p>
					) : null}
					<Tabs
						className="min-w-0 flex-col"
						onValueChange={(value) => {
							if (typeof value === "string") {
								setSelectedRoundId(value);
								router.replace(
									`/judge/schedule?round=${encodeURIComponent(value)}`,
									{ scroll: false }
								);
							}
						}}
						value={selectedRound.id}
					>
						<div className="overflow-x-auto border-border border-b pb-1">
							<TabsList
								activateOnFocus
								aria-label="Judging rounds"
								className="h-10"
							>
								{rounds.map((round) => (
									<TabsTrigger
										className="shrink-0 px-4"
										key={round.id}
										value={round.id}
									>
										{round.name}
										<span className="text-muted-foreground tabular-nums">
											{
												assignments.filter(
													(assignment) => assignment.room.roundId === round.id
												).length
											}
										</span>
										{round.id === activeRoundId ? (
											<Badge variant="accent">Active</Badge>
										) : null}
									</TabsTrigger>
								))}
							</TabsList>
						</div>
						{rounds.map((round) => (
							<TabsContent
								className="min-w-0 pt-4"
								key={round.id}
								value={round.id}
							>
								<RoundSchedule
									assignments={assignments.filter(
										(assignment) => assignment.room.roundId === round.id
									)}
									criteria={criteria}
									currentTime={currentTime}
									round={round}
								/>
							</TabsContent>
						))}
					</Tabs>
				</>
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
