"use client";

import { ArrowDownLine, ArrowUpLine } from "@mingcute/react";
import { useState } from "react";
import { toast } from "sonner";
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
import { useRefresh } from "@/hooks/use-refresh";
import { formatTime } from "@/lib/datetime";
import { getFinalistStartTime, MAX_PRESENTATION_MINUTES } from "@/lib/judging";
import { api } from "@/trpc/react";
import {
	type FinalResults,
	formatScore,
	type Layout,
	type LayoutTable,
	ManagementSection,
	plural,
	type Round
} from "./judgingShared";

type Finalist = LayoutTable["assignments"][number];

// Reordering keeps each finalist's assignment, so it works after scoring too.
function PresentationOrder({
	round,
	finalists,
	judgeCount
}: {
	round: Round;
	finalists: Finalist[];
	judgeCount: number;
}) {
	const { isRefreshing, refresh } = useRefresh();
	const [order, setOrder] = useState<Finalist[] | null>(null);
	const reorder = api.judgingResults.reorderFinalists.useMutation({
		onError: (error) => toast.error(error.message),
		onSuccess: () =>
			refresh(() => {
				toast.success("Presentation order saved.");
				setOrder(null);
			})
	});
	const isPending = reorder.isPending || isRefreshing;
	const timing = {
		startTime: round.startTime,
		presentationMinutes: round.presentationMinutes ?? MAX_PRESENTATION_MINUTES,
		changeoverMinutes: round.changeoverMinutes
	};

	function move(index: number, offset: number) {
		if (!order) return;
		const next = order.slice();
		const [finalist] = next.splice(index, 1);
		if (!finalist) return;
		next.splice(index + offset, 0, finalist);
		setOrder(next);
	}

	return (
		<ManagementSection
			action={
				order ? (
					<>
						<Button
							disabled={isPending}
							onClick={() =>
								reorder.mutate({
									assignmentIds: order.map((finalist) => finalist.id)
								})
							}
							size="sm"
						>
							Save order
						</Button>
						<Button
							disabled={isPending}
							onClick={() => setOrder(null)}
							size="sm"
							variant="outline"
						>
							Cancel
						</Button>
					</>
				) : finalists.length > 1 ? (
					<Button
						onClick={() => setOrder(finalists)}
						size="sm"
						variant="outline"
					>
						Reorder
					</Button>
				) : null
			}
			description={
				order && round.publishedAt
					? "Teams see their new times as soon as you save."
					: finalists.length
						? `${round.presentationMinutes}-minute presentations · ${plural(judgeCount, "judge")}`
						: `${round.presentationMinutes}-minute presentations`
			}
			title="Presentation order"
		>
			{finalists.length ? (
				<ol className="m-0 flex list-none flex-col gap-3 p-0">
					{(order ?? finalists).map((finalist, index, list) => (
						<li className="flex min-h-8 items-center gap-4" key={finalist.id}>
							<span className="w-20 shrink-0 text-muted-foreground tabular-nums">
								{formatTime(
									order
										? getFinalistStartTime(timing, index)
										: finalist.startsAt
								)}
							</span>
							<span className="min-w-0 flex-1 font-medium">
								{finalist.team.name}
							</span>
							{order ? (
								<div className="flex shrink-0 gap-1">
									<Button
										aria-label={`Move ${finalist.team.name} earlier`}
										disabled={isPending || index === 0}
										onClick={() => move(index, -1)}
										size="icon-sm"
										variant="outline"
									>
										<ArrowUpLine />
									</Button>
									<Button
										aria-label={`Move ${finalist.team.name} later`}
										disabled={isPending || index === list.length - 1}
										onClick={() => move(index, 1)}
										size="icon-sm"
										variant="outline"
									>
										<ArrowDownLine />
									</Button>
								</div>
							) : null}
						</li>
					))}
				</ol>
			) : (
				<Empty>
					<EmptyHeader>
						<EmptyTitle>No finalists yet</EmptyTitle>
						<EmptyDescription>
							Pick finalists from a panel round’s results.
						</EmptyDescription>
					</EmptyHeader>
				</Empty>
			)}
		</ManagementSection>
	);
}

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
			<PresentationOrder
				finalists={finalists}
				judgeCount={judgeCount}
				round={round}
			/>
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
