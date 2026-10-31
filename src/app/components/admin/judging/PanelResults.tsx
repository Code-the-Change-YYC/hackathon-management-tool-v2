"use client";

import { useState } from "react";
import { Button } from "@/app/components/ui/button";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyTitle
} from "@/app/components/ui/empty";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow
} from "@/app/components/ui/table";
import type { HackathonDates } from "@/lib/validation/event";
import { FinalistsDialog } from "./FinalistsDialog";
import {
	formatScore,
	ManagementSection,
	type PanelRanking,
	type Round
} from "./judgingShared";

export function PanelResults({
	round,
	ranking,
	hasFinalRound,
	finalRoundHasScores,
	hackathonDates,
	onFinalRoundCreated
}: {
	round: Round;
	ranking: PanelRanking[];
	hasFinalRound: boolean;
	finalRoundHasScores: boolean;
	hackathonDates: HackathonDates | null;
	onFinalRoundCreated: (roundId: string) => void;
}) {
	const [isPicking, setIsPicking] = useState(false);
	const hasScores = ranking.some((entry) => entry.normalizedScore !== null);

	return (
		<ManagementSection
			action={
				hasScores ? (
					<Button
						disabled={finalRoundHasScores}
						onClick={() => setIsPicking(true)}
						size="sm"
						title={
							finalRoundHasScores
								? "The final round has been scored, so its finalists can’t change."
								: undefined
						}
						variant={hasFinalRound ? "outline" : "default"}
					>
						{hasFinalRound ? "Change finalists" : "Pick finalists"}
					</Button>
				) : null
			}
			description="Ranked by normalized score, so strict and lenient judges count equally."
			title="Results"
		>
			{hasScores ? (
				<Table className="min-w-140">
					<TableHeader>
						<TableRow>
							<TableHead className="w-16 px-3 py-3">Rank</TableHead>
							<TableHead className="px-3 py-3">Team</TableHead>
							<TableHead className="px-3 py-3 text-right">
								Normalized score
							</TableHead>
							<TableHead className="px-3 py-3 text-right">
								Raw average
							</TableHead>
							<TableHead className="px-3 py-3 text-right">Scorecards</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{ranking.map((entry, index) => (
							<TableRow key={entry.teamId}>
								<TableCell className="px-3 py-3 font-semibold text-primary">
									{entry.normalizedScore === null ? "—" : index + 1}
								</TableCell>
								<TableCell className="wrap-break-word whitespace-normal px-3 py-3 font-medium">
									{entry.teamName}
								</TableCell>
								<TableCell className="px-3 py-3 text-right tabular-nums">
									{formatScore(entry.normalizedScore)}
								</TableCell>
								<TableCell className="px-3 py-3 text-right tabular-nums">
									{formatScore(entry.rawAverage)}
								</TableCell>
								<TableCell className="px-3 py-3 text-right tabular-nums">
									{entry.scorecardCount}/{entry.expectedScorecards}
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			) : (
				<Empty>
					<EmptyHeader>
						<EmptyTitle>No scores yet</EmptyTitle>
						<EmptyDescription>
							Teams are ranked here as judges submit scorecards.
						</EmptyDescription>
					</EmptyHeader>
				</Empty>
			)}
			{isPicking ? (
				<FinalistsDialog
					hackathonDates={hackathonDates}
					hasFinalRound={hasFinalRound}
					onClose={() => setIsPicking(false)}
					onCreated={onFinalRoundCreated}
					panelRound={round}
					ranking={ranking}
				/>
			) : null}
		</ManagementSection>
	);
}
