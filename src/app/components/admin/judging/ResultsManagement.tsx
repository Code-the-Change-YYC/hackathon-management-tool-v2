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
			description="Live team totals after scores are submitted."
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
						<TableHead className="px-3 py-3 text-right">Total score</TableHead>
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
								{Number(team.totalScore)}
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
