"use client";

import type { Criterion } from "@/app/components/judge/judgePortal";
import PageHeader from "@/app/components/PageHeader";
import { RubricCard } from "@/app/components/rubric/RubricCard";
import { useCurrentTime } from "@/hooks/use-current-time";
import type {
	JudgingProgress,
	TeamJudgingStatus
} from "@/lib/participant-judging";
import type { RouterOutputs } from "@/trpc/react";
import { JudgingTimeline } from "./JudgingTimeline";
import { TeamJudgingCard } from "./TeamJudgingCard";

type Results = RouterOutputs["scores"]["getMineReleased"];

export function JudgingView({
	progress,
	status,
	criteria,
	results
}: {
	progress: JudgingProgress;
	status: TeamJudgingStatus;
	criteria: Criterion[];
	results: Results;
}) {
	const now = useCurrentTime();
	// Finals only re-score the finalists, so every team's scores come from the panel round.
	const panelRound = progress.rounds
		.filter((round) => round.kind === "panel")
		.sort((a, b) => a.startTime.getTime() - b.startTime.getTime())[0];
	const teamScores = Object.fromEntries(
		(results.released ? results.rounds : [])
			.filter((score) => score.roundId === panelRound?.id)
			.map((score) => [score.criterionId, score.value])
	);

	return (
		<div className="flex flex-col gap-6">
			<PageHeader
				description="Stay informed and updated on judging."
				title="Judging"
			/>
			<div className="flex flex-col gap-6">
				<TeamJudgingCard now={now} progress={progress} status={status} />
				<JudgingTimeline now={now} progress={progress} />
				{results.released ? (
					<RubricCard
						criteria={criteria.filter((criterion) =>
							Object.hasOwn(teamScores, criterion.id)
						)}
						emptyDescription="Your team doesn’t have any panel-round scores."
						emptyTitle="No team scores"
						scores={teamScores}
						title="Your Scores"
					/>
				) : (
					<RubricCard
						criteria={criteria}
						emptyDescription="Check back once the judging criteria have been published."
						emptyTitle="No judging criteria yet"
						title="Judging Rubric"
					/>
				)}
			</div>
		</div>
	);
}
