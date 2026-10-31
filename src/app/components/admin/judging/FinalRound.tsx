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
import { formatTime } from "@/lib/datetime";
import {
	type FinalResults,
	formatScore,
	type Layout,
	ManagementSection,
	plural,
	type Round
} from "./judgingShared";

export function FinalRound({
	round,
	layout,
	results
}: {
	round: Round;
	layout?: Layout;
	results: FinalResults;
}) {
	const table = layout?.tables[0];
	const finalists = (table?.assignments ?? [])
		.slice()
		.sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
	const judgeCount = table?.judges.length ?? 0;

	return (
		<>
			<ManagementSection
				description={`${round.presentationMinutes}-minute presentations · ${plural(judgeCount, "judge")}`}
				title="Presentation order"
			>
				<ol className="m-0 flex list-none flex-col gap-3 p-0">
					{finalists.map((assignment) => (
						<li className="flex gap-4" key={assignment.id}>
							<span className="w-20 shrink-0 text-muted-foreground tabular-nums">
								{formatTime(assignment.startsAt)}
							</span>
							<span className="font-medium">{assignment.team.name}</span>
						</li>
					))}
				</ol>
			</ManagementSection>
			<ManagementSection
				description="Average of every judge’s main scores. This round alone decides the winner."
				title="Results"
			>
				{results?.results.length ? (
					<Table className="min-w-120">
						<TableHeader>
							<TableRow>
								<TableHead className="w-16 px-3 py-3">Rank</TableHead>
								<TableHead className="px-3 py-3">Team</TableHead>
								<TableHead className="px-3 py-3 text-right">Average</TableHead>
								<TableHead className="px-3 py-3 text-right">
									Scorecards
								</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{results.results.map((result, index) => (
								<TableRow key={result.teamId}>
									<TableCell className="px-3 py-3 font-semibold text-primary">
										{index + 1}
									</TableCell>
									<TableCell className="px-3 py-3 font-medium">
										{result.teamName}
									</TableCell>
									<TableCell className="px-3 py-3 text-right tabular-nums">
										{formatScore(result.rawAverage)}
									</TableCell>
									<TableCell className="px-3 py-3 text-right tabular-nums">
										{result.scorecardCount}/{judgeCount}
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
								Finalists are ranked here as judges submit scorecards.
							</EmptyDescription>
						</EmptyHeader>
					</Empty>
				)}
			</ManagementSection>
		</>
	);
}
