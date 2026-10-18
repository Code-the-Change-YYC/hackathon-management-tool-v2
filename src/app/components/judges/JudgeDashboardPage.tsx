"use client";

import { useMemo } from "react";
import PageHeader from "@/app/components/PageHeader";
import { useCurrentTime } from "@/hooks/use-current-time";
import { ErrorCard } from "./ErrorCard";
import { JoinMeetingButton } from "./JoinMeetingButton";
import { JudgeRoundStats } from "./JudgeRoundStats";
import { JudgeTeamCard } from "./JudgeTeamCard";
import { useJudgeUser } from "./JudgeUserProvider";
import { isAssignmentScored, type JudgeAssignment } from "./judgePortal";
import { LoadingCard } from "./LoadingCard";
import { useJudgePortalData } from "./useJudgePortalData";

export function JudgeDashboardPage() {
	const { userName } = useJudgeUser();
	const data = useJudgePortalData();
	const currentTime = useCurrentTime();

	const roundStats = useMemo(() => {
		const roundsById = new Map(
			data.rounds.map((round) => [round.id, round] as const)
		);
		for (const assignment of data.assignments) {
			roundsById.set(assignment.room.round.id, assignment.room.round);
		}

		const grouped = new Map<string, JudgeAssignment[]>();
		for (const assignment of data.assignments) {
			const roundId = assignment.room.round.id;
			grouped.set(roundId, [...(grouped.get(roundId) ?? []), assignment]);
		}

		return Array.from(grouped.entries())
			.map(([roundId, assignments]) => {
				const round = roundsById.get(roundId);
				const scored = assignments.filter((assignment) =>
					isAssignmentScored(assignment, data.criteria)
				).length;
				return {
					assigned: assignments.length,
					id: roundId,
					isActive: data.activeRoundId === roundId,
					name: round?.name ?? "Judging round",
					scored,
					startTime: round?.startTime?.getTime() ?? 0
				};
			})
			.sort(
				(a, b) =>
					Number(b.isActive) - Number(a.isActive) || a.startTime - b.startTime
			);
	}, [data.activeRoundId, data.assignments, data.criteria, data.rounds]);
	const dashboardRoundId =
		roundStats.find((round) => round.isActive)?.id ?? roundStats[0]?.id ?? "";
	const dashboardAssignments = dashboardRoundId
		? data.assignments.filter(
				(assignment) => assignment.room.round.id === dashboardRoundId
			)
		: data.assignments;
	const dashboardRoundName =
		roundStats.find((round) => round.id === dashboardRoundId)?.name ?? "";

	if (data.error) {
		return (
			<ErrorCard
				message={`Judging data could not be loaded: ${data.error.message}`}
			/>
		);
	}

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
					<p className="m-0 font-medium text-base">{data.roomSummary}</p>
					<JoinMeetingButton href={data.firstMeetingLink} />
				</div>
			</div>

			{data.isLoading ? (
				<LoadingCard />
			) : (
				<>
					{roundStats.length > 0 ? (
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
					) : null}

					<section className="flex flex-col gap-4">
						<h2 className="m-0 font-medium text-2xl leading-7">
							{dashboardRoundName ? `Teams · ${dashboardRoundName}` : "Teams"}
						</h2>
						{dashboardAssignments.length > 0 ? (
							<div className="grid gap-4 xl:grid-cols-2">
								{dashboardAssignments.map((assignment) => (
									<JudgeTeamCard
										assignment={assignment}
										criteria={data.criteria}
										currentTime={currentTime}
										key={assignment.id}
									/>
								))}
							</div>
						) : (
							<div className="rounded-2xl border border-border border-dashed p-8 text-center text-muted-foreground">
								No teams have been assigned to you yet.
							</div>
						)}
					</section>
				</>
			)}
		</div>
	);
}
