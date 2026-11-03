"use client";

import { ArrowDownLine, ArrowUpLine } from "@mingcute/react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/app/components/ui/badge";
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
import {
	BALLOT_PLACES,
	formatPlace,
	getFinalistStartTime,
	MAX_PRESENTATION_MINUTES
} from "@/lib/judging";
import { range } from "@/lib/utils";
import { api } from "@/trpc/react";
import { FinalJudgesDialog } from "./FinalJudgesDialog";
import {
	type FinalResults,
	formatScore,
	type Judge,
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

type FinalResultsData = NonNullable<FinalResults>;

const PLACES = range(BALLOT_PLACES).map((index) => index + 1);

function ResultsTable({ results }: { results: FinalResultsData["results"] }) {
	return (
		<Table className="min-w-140">
			<TableHeader>
				<TableRow>
					<TableHead className="w-16 px-3 py-3">Rank</TableHead>
					<TableHead className="px-3 py-3">Team</TableHead>
					<TableHead className="px-3 py-3 text-right">Points</TableHead>
					{PLACES.map((place) => (
						<TableHead className="px-3 py-3 text-right" key={place}>
							{formatPlace(place)}
						</TableHead>
					))}
					<TableHead className="px-3 py-3 text-right">Panel score</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{results.map((result) => (
					<TableRow key={result.teamId}>
						<TableCell className="px-3 py-3 font-semibold text-primary">
							{result.rank}
						</TableCell>
						<TableCell className="wrap-break-word whitespace-normal px-3 py-3 font-medium">
							<span className="flex flex-wrap items-center gap-2">
								{result.teamName}
								{result.tied ? <Badge variant="outline">Tied</Badge> : null}
							</span>
						</TableCell>
						<TableCell className="px-3 py-3 text-right font-semibold tabular-nums">
							{result.points}
						</TableCell>
						{PLACES.map((place) => (
							<TableCell
								className="px-3 py-3 text-right tabular-nums"
								key={place}
							>
								{result.placeVotes[place - 1]}
							</TableCell>
						))}
						<TableCell className="px-3 py-3 text-right tabular-nums">
							{formatScore(result.panelScore)}
						</TableCell>
					</TableRow>
				))}
			</TableBody>
		</Table>
	);
}

function Ballots({
	ballots,
	judges,
	scoresReleased
}: {
	ballots: FinalResultsData["ballots"];
	judges: Judge[];
	scoresReleased: boolean;
}) {
	const [isManaging, setIsManaging] = useState(false);
	const submittedCount = ballots.filter(
		(ballot) => ballot.teamNames.length > 0
	).length;

	return (
		<ManagementSection
			action={
				<Button
					disabled={scoresReleased}
					onClick={() => setIsManaging(true)}
					size="sm"
					title={
						scoresReleased
							? "The final table can’t change once scores are released."
							: undefined
					}
					variant="outline"
				>
					Manage judges
				</Button>
			}
			description={
				scoresReleased
					? `${submittedCount}/${ballots.length} ballots in. Ranking closed when scores were released.`
					: `${submittedCount}/${ballots.length} ballots in. Judges can change their ranking until scores are released.`
			}
			title="Ballots"
		>
			<Table className="min-w-140">
				<TableHeader>
					<TableRow>
						<TableHead className="px-3 py-3">Judge</TableHead>
						{PLACES.map((place) => (
							<TableHead className="px-3 py-3" key={place}>
								{formatPlace(place)}
							</TableHead>
						))}
					</TableRow>
				</TableHeader>
				<TableBody>
					{ballots.map((ballot) => (
						<TableRow key={ballot.judgeId}>
							<TableCell className="wrap-break-word whitespace-normal px-3 py-3 font-medium">
								{ballot.judgeName}
							</TableCell>
							{ballot.teamNames.length ? (
								PLACES.map((place) => (
									<TableCell
										className="wrap-break-word whitespace-normal px-3 py-3"
										key={place}
									>
										{ballot.teamNames[place - 1]}
									</TableCell>
								))
							) : (
								<TableCell
									className="px-3 py-3 text-muted-foreground"
									colSpan={BALLOT_PLACES}
								>
									Not submitted
								</TableCell>
							)}
						</TableRow>
					))}
				</TableBody>
			</Table>
			{isManaging ? (
				<FinalJudgesDialog
					judges={judges}
					onClose={() => setIsManaging(false)}
					rankedIds={ballots
						.filter((ballot) => ballot.teamNames.length > 0)
						.map((ballot) => ballot.judgeId)}
					seatedIds={ballots.map((ballot) => ballot.judgeId)}
				/>
			) : null}
		</ManagementSection>
	);
}

export function FinalRound({
	round,
	layout,
	results,
	judges,
	scoresReleased
}: {
	round: Round;
	layout?: Layout;
	results: FinalResults;
	judges: Judge[];
	scoresReleased: boolean;
}) {
	const table = layout?.tables[0];
	const finalists = (table?.assignments ?? [])
		.slice()
		.sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
	const judgeCount = table?.judges.length ?? 0;
	const ballots = results?.ballots ?? [];
	const hasBallots = ballots.some((ballot) => ballot.teamNames.length > 0);

	return (
		<>
			<PresentationOrder
				finalists={finalists}
				judgeCount={judgeCount}
				round={round}
			/>
			<ManagementSection
				description="Each judge ranks their top 3: 3 points for 1st, 2 for 2nd and 1 for 3rd. Ties go to more 1st-place votes, then the panel score."
				title="Results"
			>
				{results && hasBallots ? (
					<div className="flex flex-col gap-3">
						<ResultsTable results={results.results} />
						{results.results.some((result) => result.tied) ? (
							<p className="m-0 text-muted-foreground text-sm">
								Tied teams are level on points, 1st-place votes and panel score.
								Decide their order in deliberation.
							</p>
						) : null}
					</div>
				) : (
					<Empty>
						<EmptyHeader>
							<EmptyTitle>No ballots yet</EmptyTitle>
							<EmptyDescription>
								Judges can rank the finalists once the final round starts.
							</EmptyDescription>
						</EmptyHeader>
					</Empty>
				)}
			</ManagementSection>
			{ballots.length ? (
				<Ballots
					ballots={ballots}
					judges={judges}
					scoresReleased={scoresReleased}
				/>
			) : null}
		</>
	);
}
