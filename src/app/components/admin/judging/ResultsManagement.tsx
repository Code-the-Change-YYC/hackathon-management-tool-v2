"use client";

import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow
} from "@/app/components/ui/table";
import { api } from "@/trpc/react";

import { ManagementSection } from "./judgingShared";

export function ResultsManagement() {
	const rankingsQuery = api.teams.getRankings.useQuery();

	return (
		<ManagementSection
			description="Live team totals after scores are submitted."
			id="results-management"
			title="Results"
		>
			<Table className="min-w-[520px]">
				<TableHeader>
					<TableRow>
						<TableHead className="w-24 px-3 py-3">Rank</TableHead>
						<TableHead className="px-3 py-3">Team</TableHead>
						<TableHead className="px-3 py-3 text-right">Total score</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{(rankingsQuery.data ?? []).map((team, index) => (
						<TableRow key={team.id}>
							<TableCell className="px-3 py-4 font-semibold text-primary">
								{index + 1}
							</TableCell>
							<TableCell className="px-3 py-4 font-medium">
								{team.name}
							</TableCell>
							<TableCell className="px-3 py-4 text-right">
								{Number(team.totalScore)}
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
			{!rankingsQuery.isLoading && !rankingsQuery.data?.length ? (
				<p className="py-5 text-center text-muted-foreground">
					No teams are available for ranking.
				</p>
			) : null}
		</ManagementSection>
	);
}
