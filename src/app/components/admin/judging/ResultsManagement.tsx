"use client";

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
import { ManagementSection, type Ranking } from "./judgingShared";

export function ResultsManagement({ rankings }: { rankings: Ranking[] }) {
	return (
		<ManagementSection
			description="Average main score across submitted judge scorecards and rounds. Side pots are excluded. Results remain provisional while scorecards are outstanding."
			id="results-management"
			title="Results"
		>
			<Table className="w-full">
				<TableHeader>
					<TableRow>
						<TableHead className="w-16 px-2 py-3 sm:w-24 sm:px-3">
							Rank
						</TableHead>
						<TableHead className="px-3 py-3">Team</TableHead>
						<TableHead className="px-3 py-3 text-right">
							Average score
						</TableHead>
						<TableHead className="px-3 py-3 text-right">Scorecards</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{rankings.map((team, index) => (
						<TableRow key={team.id}>
							<TableCell className="px-3 py-4 font-semibold text-primary">
								{index + 1}
							</TableCell>
							<TableCell className="wrap-break-word whitespace-normal px-2 py-4 font-medium sm:px-3">
								{team.name}
							</TableCell>
							<TableCell className="px-3 py-4 text-right">
								{team.submittedScorecards
									? Number(Number(team.totalScore).toFixed(2))
									: "—"}
							</TableCell>
							<TableCell className="px-3 py-4 text-right tabular-nums">
								{team.submittedScorecards}/{team.expectedScorecards}
								{team.legacyScores ? (
									<span className="block text-muted-foreground text-xs">
										{team.legacyScores} legacy scores excluded
									</span>
								) : null}
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
			{rankings.length === 0 && (
				<Empty>
					<EmptyHeader>
						<EmptyTitle>No results yet</EmptyTitle>
						<EmptyDescription>
							Team totals appear here once judges submit scores.
						</EmptyDescription>
					</EmptyHeader>
				</Empty>
			)}
		</ManagementSection>
	);
}
