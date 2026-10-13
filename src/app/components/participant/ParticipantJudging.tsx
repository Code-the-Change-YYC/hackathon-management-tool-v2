"use client";

import { useState } from "react";
import Banner from "@/app/components/Banner";
import type { Criterion } from "@/app/components/judges/judgePortal";
import PageHeader from "@/app/components/PageHeader";
import { ToggleGroup, ToggleGroupItem } from "@/app/components/ui/toggle-group";
import { useCurrentTime } from "@/hooks/use-current-time";
import { criterionAppliesToRound } from "@/lib/judging";
import {
	type DashboardEvent,
	eventNavigationUrlSchema,
	getCurrentEvent
} from "@/lib/participant-events";
import { type JudgingRound, judgingStages } from "@/lib/participant-judging";
import { api, type RouterOutputs } from "@/trpc/react";
import { CurrentEventBanner } from "./CurrentEventBanner";
import CurrentEventImages from "./CurrentEventImages";
import { DataState } from "./DataState";
import { ParticipantRubric } from "./ParticipantRubric";
import { JudgingStatus } from "./ParticipantStatus";

type Settings = RouterOutputs["hackathonSettings"]["get"];
type Assignment = RouterOutputs["judgingAssignments"]["getMineForActiveRound"];
type Results = RouterOutputs["scores"]["getMineReleased"];
const refresh = { refetchInterval: 30_000, refetchOnWindowFocus: true };

function RoundFilter({
	rounds,
	selected,
	onSelect,
	available,
	label
}: {
	rounds: JudgingRound[];
	selected: string;
	onSelect: (id: string) => void;
	available: Set<string>;
	label: string;
}) {
	return (
		<ToggleGroup
			aria-label={label}
			className="max-w-full flex-wrap gap-2"
			onValueChange={(values) => {
				if (values[0]) onSelect(String(values[0]));
			}}
			size="sm"
			value={selected ? [selected] : []}
			variant="outline"
		>
			{rounds.map((round) => (
				<ToggleGroupItem
					className="h-7 rounded-md border-grey-300 bg-white px-4 font-medium text-grey-600 text-sm/5 disabled:bg-grey-100 disabled:text-grey-400 data-pressed:border-purple-500 data-pressed:bg-purple-100 data-pressed:text-purple-800"
					disabled={!available.has(round.id)}
					key={round.id}
					value={round.id}
				>
					{round.name}
				</ToggleGroupItem>
			))}
		</ToggleGroup>
	);
}

function RoundRubric({
	criteria,
	rounds,
	available,
	scores
}: {
	criteria: Criterion[];
	rounds: JudgingRound[];
	available: Set<string>;
	scores?: Results["rounds"];
}) {
	const [selected, setSelected] = useState("");
	const roundId = available.has(selected)
		? selected
		: (rounds.find((round) => available.has(round.id))?.id ?? "");
	const filtered = roundId
		? criteria.filter((criterion) =>
				criterionAppliesToRound(criterion, roundId)
			)
		: rounds.length
			? []
			: criteria;
	const roundScores = scores?.filter((score) => score.roundId === roundId);
	const values = scores
		? Object.fromEntries(
				(roundScores ?? []).map((score) => [score.criterionId, score.value])
			)
		: undefined;
	return (
		<>
			{scores && !roundScores?.length ? (
				<p className="text-grey-600 text-sm/5">
					No scores have been published for your team yet.
				</p>
			) : (
				<ParticipantRubric
					criteria={
						scores
							? filtered.filter(
									(criterion) => values?.[criterion.id] !== undefined
								)
							: filtered
					}
					key={roundId}
					scores={values}
				>
					<RoundFilter
						available={available}
						label={scores ? "Team score round" : "Rubric round"}
						onSelect={setSelected}
						rounds={rounds}
						selected={roundId}
					/>
				</ParticipantRubric>
			)}
		</>
	);
}

export function ParticipantJudging() {
	const settings = api.hackathonSettings.get.useQuery(undefined, refresh);
	const events = api.events.getActiveEvents.useQuery(undefined, refresh);
	const rounds = api.judgingRounds.getAll.useQuery(undefined, refresh);
	const criteria = api.criteria.getAll.useQuery(undefined, refresh);
	const assignment = api.judgingAssignments.getMineForActiveRound.useQuery(
		undefined,
		refresh
	);
	const released = settings.data?.judgingPhase === "winners_announced";
	const scores = api.scores.getMineReleased.useQuery(undefined, {
		...refresh,
		enabled: released
	});
	const queries = [settings, events, rounds, criteria, assignment];
	return (
		<DataState
			error={queries.some((query) => query.isError)}
			label="Loading judging information"
			loading={queries.some((query) => query.isPending)}
			retry={() => {
				for (const query of queries) void query.refetch();
			}}
		>
			<JudgingView
				assignment={assignment.data ?? null}
				criteria={criteria.data ?? []}
				events={events.data ?? []}
				results={scores.data}
				retryScores={() => void scores.refetch()}
				rounds={rounds.data ?? []}
				scoresError={scores.isError}
				scoresLoading={released && scores.isPending}
				settings={settings.data ?? null}
			/>
		</DataState>
	);
}

export function JudgingView({
	settings,
	events,
	rounds,
	criteria,
	assignment,
	results,
	scoresLoading = false,
	scoresError = false,
	retryScores = () => {}
}: {
	settings: Settings;
	events: DashboardEvent[];
	rounds: JudgingRound[];
	criteria: Criterion[];
	assignment: Assignment;
	results?: Results;
	scoresLoading?: boolean;
	scoresError?: boolean;
	retryScores?: () => void;
}) {
	const now = useCurrentTime();
	const timeZone = settings?.timeZone ?? "America/Edmonton";
	const phase = settings?.judgingPhase ?? "not_started";
	const ordered = rounds
		.slice()
		.sort(
			(a, b) =>
				a.startTime.getTime() - b.startTime.getTime() ||
				a.id.localeCompare(b.id)
		);
	const stages = judgingStages(
		phase,
		ordered,
		settings?.currentRoundId ?? null
	);
	const available = new Set(
		stages
			.filter((stage) => stage.state !== "upcoming")
			.map((stage) => stage.id)
	);
	// Publish the shared rubric before judging starts; subsequent rounds unlock with the configured phase.
	if (ordered[0] && !ordered.some((round) => available.has(round.id)))
		available.add(ordered[0].id);
	const meetingUrl = eventNavigationUrlSchema.safeParse(
		assignment?.room.roomLink
	);
	return (
		<div className="flex flex-col gap-6">
			<PageHeader
				description="Understand the scoring so you know where to focus."
				title="Judging"
			/>
			<div className="flex flex-col gap-12">
				{assignment ? (
					<Banner
						buttonText="Join meeting"
						colour="red"
						endTime={
							assignment.timeSlot ? undefined : assignment.room.round.endTime
						}
						href={meetingUrl.success ? meetingUrl.data : undefined}
						image={<CurrentEventImages />}
						location={assignment.room.name}
						startTime={assignment.timeSlot ?? assignment.room.round.startTime}
						timeZone={timeZone}
						title={`${assignment.room.round.name}: your team’s judging assignment`}
					/>
				) : (
					<CurrentEventBanner
						colour="red"
						event={getCurrentEvent(events, now)}
						timeZone={timeZone}
					/>
				)}
				<JudgingStatus
					currentRoundId={settings?.currentRoundId ?? null}
					phase={phase}
					rounds={ordered}
					variant="detailed"
				/>
				<section
					aria-labelledby="rubric-title"
					className="flex min-w-0 flex-col gap-6"
				>
					<div>
						<h2 className="font-medium text-[22px]/7" id="rubric-title">
							Judging Rubric
						</h2>
					</div>
					<RoundRubric
						available={available}
						criteria={criteria}
						rounds={ordered}
					/>
				</section>
				{phase === "winners_announced" && (
					<section
						aria-labelledby="team-scores-title"
						className="flex min-w-0 flex-col gap-6"
					>
						<div>
							<h2 className="font-medium text-[22px]/7" id="team-scores-title">
								Team Scores
							</h2>
						</div>
						<DataState
							error={scoresError}
							label="Loading team scores"
							loading={scoresLoading}
							retry={retryScores}
						>
							<RoundRubric
								available={
									new Set(
										results?.released
											? results.rounds.map((score) => score.roundId)
											: []
									)
								}
								criteria={criteria}
								rounds={ordered}
								scores={results?.released ? results.rounds : []}
							/>
						</DataState>
					</section>
				)}
			</div>
		</div>
	);
}
