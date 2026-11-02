"use client";

import { AddLine } from "@mingcute/react";
import { useState } from "react";
import PageHeader from "@/app/components/PageHeader";
import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyTitle
} from "@/app/components/ui/empty";
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger
} from "@/app/components/ui/tabs";
import type { HackathonDates } from "@/lib/validation/event";
import { CriteriaCard } from "./CriteriaCard";
import { FinalRound } from "./FinalRound";
import type {
	Assignment,
	Criterion,
	FinalResults,
	Judge,
	Layout,
	Layouts,
	PanelRanking,
	Round,
	Team
} from "./judgingShared";
import { PanelResults } from "./PanelResults";
import { PanelSchedule } from "./PanelSchedule";
import { RoundDialog } from "./RoundDialog";
import { RoundHeader } from "./RoundHeader";
import { ScoreRelease } from "./ScoreRelease";

// Every judge at the final table has submitted a scorecard for every finalist.
function isFinalRoundScored(layout: Layout | undefined, results: FinalResults) {
	const table = layout?.tables[0];
	if (!table?.assignments.length || !table.judges.length) return false;
	return table.assignments.every((assignment) =>
		results?.results.some(
			(result) =>
				result.teamId === assignment.team.id &&
				result.scorecardCount >= table.judges.length
		)
	);
}

export function JudgingView({
	rounds,
	activeRoundId,
	layouts,
	assignments,
	judges,
	teams,
	criteria,
	rankings,
	finalResults,
	hackathonDates,
	scoresReleased
}: {
	rounds: Round[];
	activeRoundId: string | null;
	layouts: Layouts;
	assignments: Assignment[];
	judges: Judge[];
	teams: Team[];
	criteria: Criterion[];
	rankings: Record<string, PanelRanking[]>;
	finalResults: FinalResults;
	hackathonDates: HackathonDates | null;
	scoresReleased: boolean;
}) {
	const [selectedId, setSelectedId] = useState<string | null>(null);
	const [isAddingRound, setIsAddingRound] = useState(false);
	const orderedRounds = rounds
		.slice()
		.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
	const selected =
		orderedRounds.find((round) => round.id === selectedId) ??
		orderedRounds.find((round) => round.id === activeRoundId) ??
		orderedRounds[0];
	const scoredRoundIds = new Set(
		assignments
			.filter((assignment) => assignment.scores.length > 0)
			.map((assignment) => assignment.table.round.id)
	);
	const finalRound = orderedRounds.find((round) => round.kind === "final");
	const addRoundButton = (
		<Button onClick={() => setIsAddingRound(true)} size="sm">
			Add round
			<AddLine data-icon="inline-end" />
		</Button>
	);

	return (
		<div className="flex flex-col gap-6">
			<PageHeader
				description="Schedule each round, publish times to teams, pick finalists from the results, then release scores."
				title="Judging"
			/>

			<ScoreRelease
				finalRoundScored={isFinalRoundScored(
					finalRound && layouts[finalRound.id],
					finalResults
				)}
				released={scoresReleased}
			/>

			{selected ? (
				<Tabs
					className="gap-4"
					onValueChange={(value) => setSelectedId(String(value))}
					value={selected.id}
				>
					<div className="flex flex-wrap items-center justify-between gap-3">
						<TabsList className="h-9">
							{orderedRounds.map((round) => (
								<TabsTrigger className="px-3" key={round.id} value={round.id}>
									{round.name}
								</TabsTrigger>
							))}
						</TabsList>
						{addRoundButton}
					</div>
					{orderedRounds.map((round) => {
						const hasSchedule = Boolean(layouts[round.id]?.tables.length);
						return (
							<TabsContent
								className="flex flex-col gap-6"
								key={round.id}
								value={round.id}
							>
								<RoundHeader
									hackathonDates={hackathonDates}
									hasSchedule={hasSchedule}
									hasScores={scoredRoundIds.has(round.id)}
									isCurrent={round.id === activeRoundId}
									round={round}
								/>
								{round.kind === "panel" ? (
									<>
										<PanelSchedule
											hasScores={scoredRoundIds.has(round.id)}
											judges={judges}
											layout={layouts[round.id]}
											round={round}
											teams={teams}
										/>
										{hasSchedule ? (
											<PanelResults
												finalRoundHasScores={Boolean(
													finalRound && scoredRoundIds.has(finalRound.id)
												)}
												hackathonDates={hackathonDates}
												hasFinalRound={Boolean(finalRound)}
												onFinalRoundCreated={setSelectedId}
												ranking={rankings[round.id] ?? []}
												round={round}
											/>
										) : null}
									</>
								) : (
									<FinalRound
										layout={layouts[round.id]}
										results={finalResults}
										round={round}
									/>
								)}
							</TabsContent>
						);
					})}
				</Tabs>
			) : (
				<Card>
					<Empty>
						<EmptyHeader>
							<EmptyTitle>No judging rounds yet</EmptyTitle>
							<EmptyDescription>
								Add a panel round to start scheduling judging.
							</EmptyDescription>
						</EmptyHeader>
						<EmptyContent>{addRoundButton}</EmptyContent>
					</Empty>
				</Card>
			)}

			<CriteriaCard criteria={criteria} rounds={orderedRounds} />

			{isAddingRound ? (
				<RoundDialog
					hackathonDates={hackathonDates}
					onClose={() => setIsAddingRound(false)}
					onSaved={setSelectedId}
				/>
			) : null}
		</div>
	);
}
