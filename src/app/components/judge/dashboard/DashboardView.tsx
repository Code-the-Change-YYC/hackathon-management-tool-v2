"use client";

import PageHeader from "@/app/components/PageHeader";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyTitle
} from "@/app/components/ui/empty";
import { useCurrentTime } from "@/hooks/use-current-time";
import type { JudgingRound } from "@/lib/participant-judging";
import {
	type Criterion,
	getMeetingLink,
	getRoomName,
	isAssignmentScored,
	type JudgeAssignment,
	sortAssignments
} from "../judgePortal";
import { JoinMeetingButton } from "./JoinMeetingButton";
import { JudgeRoundStats } from "./JudgeRoundStats";
import { JudgeTeamCard } from "./JudgeTeamCard";

function getRoundStats(
	assignments: JudgeAssignment[],
	criteria: Criterion[],
	rounds: JudgingRound[],
	activeRoundId: string | null
) {
	const roundsById = new Map(rounds.map((round) => [round.id, round] as const));
	const grouped = new Map<string, JudgeAssignment[]>();
	for (const assignment of assignments) {
		const round = assignment.room.round;
		roundsById.set(round.id, round);
		grouped.set(round.id, [...(grouped.get(round.id) ?? []), assignment]);
	}

	return Array.from(grouped.entries())
		.map(([roundId, roundAssignments]) => {
			const round = roundsById.get(roundId);
			return {
				assigned: roundAssignments.length,
				id: roundId,
				isActive: activeRoundId === roundId,
				name: round?.name ?? "Judging round",
				scored: roundAssignments.filter((assignment) =>
					isAssignmentScored(assignment, criteria)
				).length,
				startTime: round?.startTime.getTime() ?? 0
			};
		})
		.sort(
			(a, b) =>
				Number(b.isActive) - Number(a.isActive) || a.startTime - b.startTime
		);
}

export function DashboardView({
	userName,
	activeRoundId,
	rounds,
	assignments,
	criteria
}: {
	userName: string;
	activeRoundId: string | null;
	rounds: JudgingRound[];
	assignments: JudgeAssignment[];
	criteria: Criterion[];
}) {
	const currentTime = useCurrentTime();
	const roundStats = getRoundStats(
		assignments,
		criteria,
		rounds,
		activeRoundId
	);
	// Shows the active round's teams, or the earliest round's before judging starts.
	const shownRound = roundStats[0];
	const shownAssignments = assignments
		.filter((assignment) => assignment.room.round.id === shownRound?.id)
		.sort(sortAssignments);
	const roomName = getRoomName(assignments);

	return (
		<div className="flex flex-col gap-6">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
				<PageHeader
					description="Manage and score your assigned teams."
					title={
						<>
							Hi, <span className="text-strawberry-red">{userName}!</span>
						</>
					}
				/>
				<div className="flex flex-col items-start gap-1 sm:items-end">
					<p className="m-0 font-medium text-base">
						{roomName
							? `You’ve been assigned to ${roomName}`
							: "No room assigned yet"}
					</p>
					<JoinMeetingButton href={getMeetingLink(assignments)} />
				</div>
			</div>

			{roundStats.length > 0 && (
				<section className="grid gap-4 xl:grid-cols-2">
					{roundStats.map((round) => (
						<JudgeRoundStats
							assigned={round.assigned}
							key={round.id}
							name={round.name}
							scored={round.scored}
						/>
					))}
				</section>
			)}

			<section className="flex flex-col gap-4">
				<h2 className="font-medium text-xl">
					{shownRound ? `Teams · ${shownRound.name}` : "Teams"}
				</h2>
				{shownAssignments.length > 0 ? (
					<div className="grid gap-4 xl:grid-cols-2">
						{shownAssignments.map((assignment) => (
							<JudgeTeamCard
								assignment={assignment}
								criteria={criteria}
								currentTime={currentTime}
								key={assignment.id}
							/>
						))}
					</div>
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
			</section>
		</div>
	);
}
