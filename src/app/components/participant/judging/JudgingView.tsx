"use client";

import { useState } from "react";
import Banner from "@/app/components/Banner";
import type { Criterion } from "@/app/components/judges/judgePortal";
import PageHeader from "@/app/components/PageHeader";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyTitle
} from "@/app/components/ui/empty";
import { ToggleGroup, ToggleGroupItem } from "@/app/components/ui/toggle-group";
import { useCurrentTime } from "@/hooks/use-current-time";
import { criterionAppliesToRound } from "@/lib/judging";
import {
	type DashboardEvent,
	eventNavigationUrlSchema,
	getCurrentEvent
} from "@/lib/participant-events";
import { type JudgingRound, judgingStages } from "@/lib/participant-judging";
import type { RouterOutputs } from "@/trpc/react";
import { CurrentEventBanner } from "../CurrentEventBanner";
import CurrentEventImages from "../CurrentEventImages";
import { ParticipantRubric } from "../ParticipantRubric";
import { JudgingStatus } from "../ParticipantStatus";

type Settings = RouterOutputs["hackathonSettings"]["get"];
type Assignment = RouterOutputs["judgingAssignments"]["getMineForActiveRound"];
type Results = RouterOutputs["scores"]["getMineReleased"];

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

	if (scores && !roundScores?.length) {
		return (
			<Empty>
				<EmptyHeader>
					<EmptyTitle>No team scores yet</EmptyTitle>
					<EmptyDescription>
						Your team’s scores will appear here once they’re published.
					</EmptyDescription>
				</EmptyHeader>
			</Empty>
		);
	}

	return (
		<ParticipantRubric
			criteria={
				scores
					? filtered.filter((criterion) => values?.[criterion.id] !== undefined)
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
	);
}

export function JudgingView({
	settings,
	events,
	rounds,
	criteria,
	assignment,
	results
}: {
	settings: Settings;
	events: DashboardEvent[];
	rounds: JudgingRound[];
	criteria: Criterion[];
	assignment: Assignment;
	results: Results;
}) {
	const now = useCurrentTime();
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
	const releasedScores = results.released ? results.rounds : [];

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
						title={`${assignment.room.round.name}: your team’s judging assignment`}
					/>
				) : (
					<CurrentEventBanner
						colour="red"
						event={getCurrentEvent(events, now)}
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
					<h2 className="font-medium text-xl" id="rubric-title">
						Judging Rubric
					</h2>
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
						<h2 className="font-medium text-xl" id="team-scores-title">
							Team Scores
						</h2>
						<RoundRubric
							available={new Set(releasedScores.map((score) => score.roundId))}
							criteria={criteria}
							rounds={ordered}
							scores={releasedScores}
						/>
					</section>
				)}
			</div>
		</div>
	);
}
