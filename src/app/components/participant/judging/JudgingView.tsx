"use client";

import type { Criterion } from "@/app/components/judge/judgePortal";
import PageHeader from "@/app/components/PageHeader";
import { RubricCard } from "@/app/components/rubric/RubricCard";
import { useCurrentTime } from "@/hooks/use-current-time";
import { type DashboardEvent, getCurrentEvent } from "@/lib/participant-events";
import {
	getUpcomingJudging,
	type JudgingRound,
	type TeamJudging
} from "@/lib/participant-judging";
import type { RouterOutputs } from "@/trpc/react";
import { CurrentEventBanner } from "../CurrentEventBanner";
import { JudgingStatus } from "../dashboard/JudgingStatus";
import { TeamJudgingBanner } from "./TeamJudgingBanner";

type Settings = RouterOutputs["hackathonSettings"]["get"];
type Results = RouterOutputs["scores"]["getMineReleased"];

export function JudgingView({
	settings,
	events,
	rounds,
	criteria,
	judging,
	results
}: {
	settings: Settings;
	events: DashboardEvent[];
	rounds: JudgingRound[];
	criteria: Criterion[];
	judging: TeamJudging;
	results: Results;
}) {
	const now = useCurrentTime();
	const phase = settings?.judgingPhase ?? "not_started";
	const ordered = rounds
		.slice()
		.sort(
			(a, b) =>
				a.startTime.getTime() - b.startTime.getTime() ||
				a.id.localeCompare(b.id)
		);
	const upcoming = getUpcomingJudging(judging, now);
	// Finals only re-score the finalists, so every team's scores come from the panel round.
	const panelRound = ordered.find((round) => round.kind === "panel");
	const teamScores = Object.fromEntries(
		(results.released ? results.rounds : [])
			.filter((score) => score.roundId === panelRound?.id)
			.map((score) => [score.criterionId, score.value])
	);

	return (
		<div className="flex flex-col gap-6">
			<PageHeader
				description="Understand the scoring so you know where to focus."
				title="Judging"
			/>
			<div className="flex flex-col gap-6">
				{upcoming ? (
					<TeamJudgingBanner judging={upcoming} />
				) : (
					<CurrentEventBanner
						colour="red"
						event={getCurrentEvent(events, now)}
					/>
				)}
				<JudgingStatus
					currentRoundId={settings?.currentRoundId ?? null}
					phase={phase}
					rounds={ordered}
					variant="detailed"
				/>
				<RubricCard
					criteria={criteria}
					emptyDescription="Check back once the judging criteria have been published."
					emptyTitle="No judging criteria yet"
					title="Judging Rubric"
				/>
				{phase === "winners_announced" && (
					<RubricCard
						criteria={criteria.filter((criterion) =>
							Object.hasOwn(teamScores, criterion.id)
						)}
						emptyDescription="Your team’s scores will appear here once they’re published."
						emptyTitle="No team scores yet"
						scores={teamScores}
						title="Team Scores"
					/>
				)}
			</div>
		</div>
	);
}
