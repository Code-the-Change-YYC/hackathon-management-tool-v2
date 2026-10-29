"use client";

import { useState } from "react";
import PageHeader from "@/app/components/PageHeader";
import { Card } from "@/app/components/ui/card";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyTitle
} from "@/app/components/ui/empty";
import { ToggleGroup, ToggleGroupItem } from "@/app/components/ui/toggle-group";
import { useCurrentTime } from "@/hooks/use-current-time";
import { formatTime } from "@/lib/datetime";
import type { JudgingRound } from "@/lib/participant-judging";
import {
	type Criterion,
	getJudgeTable,
	isAssignmentScored,
	type JudgeAssignment,
	sortAssignments,
	withBreaks
} from "../judgePortal";
import { JudgeNextTeam } from "./JudgeNextTeam";
import { JudgeTeamRow } from "./JudgeTeamRow";

function formatJudgeList(names: string[]) {
	if (names.length <= 1) return names.join("");
	return `${names.slice(0, -1).join(", ")} and ${names.at(-1)}`;
}

function getRoundStats(
	assignments: JudgeAssignment[],
	criteria: Criterion[],
	rounds: JudgingRound[]
) {
	const roundsById = new Map(rounds.map((round) => [round.id, round] as const));
	const grouped = new Map<string, JudgeAssignment[]>();
	for (const assignment of assignments) {
		const round = assignment.table.round;
		roundsById.set(round.id, round);
		grouped.set(round.id, [...(grouped.get(round.id) ?? []), assignment]);
	}

	return Array.from(grouped.entries())
		.map(([roundId, roundAssignments]) => {
			const round = roundsById.get(roundId);
			return {
				assignments: roundAssignments.sort(sortAssignments),
				id: roundId,
				name: round?.name ?? "Judging round",
				scored: roundAssignments.filter((assignment) =>
					isAssignmentScored(assignment, criteria)
				).length,
				startTime: round?.startTime.getTime() ?? 0
			};
		})
		.sort((a, b) => a.startTime - b.startTime);
}

export function DashboardView({
	userId,
	userName,
	activeRoundId,
	rounds,
	assignments,
	criteria
}: {
	userId: string;
	userName: string;
	activeRoundId: string | null;
	rounds: JudgingRound[];
	assignments: JudgeAssignment[];
	criteria: Criterion[];
}) {
	const currentTime = useCurrentTime();
	const [selectedRoundId, setSelectedRoundId] = useState<string | null>(null);
	const roundStats = getRoundStats(assignments, criteria, rounds);
	const shownRound =
		roundStats.find(
			(round) => round.id === (selectedRoundId ?? activeRoundId)
		) ??
		roundStats.find((round) => round.scored < round.assignments.length) ??
		roundStats.at(-1);
	const shownAssignments = shownRound?.assignments ?? [];
	const table = getJudgeTable(shownAssignments, userId);
	const progress = shownRound
		? (shownRound.scored / shownRound.assignments.length) * 100
		: 0;

	return (
		<div className="flex flex-col gap-6">
			<PageHeader
				description={
					table && shownRound
						? `You’re at ${table.name} for the ${shownRound.name}${
								table.otherJudges.length
									? ` with ${formatJudgeList(table.otherJudges)}`
									: ""
							}.`
						: "No table assigned yet."
				}
				title={`Hi, ${userName}!`}
			/>

			{roundStats.length > 1 && (
				<ToggleGroup
					aria-label="Judging round"
					className="max-w-full flex-wrap gap-2"
					onValueChange={(values) => {
						if (values[0]) setSelectedRoundId(String(values[0]));
					}}
					size="sm"
					value={shownRound ? [shownRound.id] : []}
					variant="outline"
				>
					{roundStats.map((round) => (
						<ToggleGroupItem
							className="h-9 rounded-md border-grey-300 bg-white px-4 font-medium text-grey-600 text-sm data-pressed:border-purple-500 data-pressed:bg-purple-100 data-pressed:text-purple-800"
							key={round.id}
							value={round.id}
						>
							{round.name}
							<span className="opacity-70">
								{round.scored}/{round.assignments.length}
							</span>
						</ToggleGroupItem>
					))}
				</ToggleGroup>
			)}

			{shownRound ? (
				<>
					<JudgeNextTeam
						assignment={shownAssignments.find(
							(assignment) => !isAssignmentScored(assignment, criteria)
						)}
						currentTime={currentTime}
						teamCount={shownAssignments.length}
					/>

					<section className="flex flex-col gap-3">
						<div className="flex flex-wrap items-baseline justify-between gap-2">
							<h2 className="m-0 font-medium text-xl">Your teams</h2>
							<p className="m-0 text-muted-foreground text-sm">
								{shownRound.scored} of {shownAssignments.length} scored
							</p>
						</div>
						<div
							aria-hidden
							className="h-2 overflow-hidden rounded-full bg-grey-200"
						>
							<div
								className="h-full rounded-full bg-judging-success transition-[width]"
								style={{ width: `${progress}%` }}
							/>
						</div>
						<Card className="py-0">
							<ul className="m-0 list-none divide-y divide-grey-200 p-0">
								{withBreaks(shownAssignments).map((item) =>
									item.kind === "break" ? (
										<li
											className="flex min-h-12 items-center gap-4 bg-muted/50 px-4 py-2 text-muted-foreground text-sm sm:px-6"
											key={`break-${item.startsAt.getTime()}`}
										>
											<span className="w-16 shrink-0 sm:w-20">
												{formatTime(item.startsAt)}
											</span>
											<span>Break until {formatTime(item.endsAt)}</span>
										</li>
									) : (
										<JudgeTeamRow
											assignment={item.assignment}
											criteria={criteria}
											currentTime={currentTime}
											key={item.assignment.id}
										/>
									)
								)}
							</ul>
						</Card>
					</section>
				</>
			) : (
				<Empty className="border">
					<EmptyHeader>
						<EmptyTitle>No teams assigned yet</EmptyTitle>
						<EmptyDescription>
							Your assigned teams will appear here once the schedule is set.
						</EmptyDescription>
					</EmptyHeader>
				</Empty>
			)}
		</div>
	);
}
