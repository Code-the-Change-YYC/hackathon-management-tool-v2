"use client";

import { addMinutes } from "date-fns";
import { useState } from "react";
import {
	ConfirmAlertDialog,
	useConfirmDialog
} from "@/app/components/ConfirmAlertDialog";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Checkbox } from "@/app/components/ui/checkbox";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyTitle
} from "@/app/components/ui/empty";
import {
	Field,
	FieldError,
	FieldGroup,
	FieldLabel
} from "@/app/components/ui/field";
import { Input } from "@/app/components/ui/input";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue
} from "@/app/components/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow
} from "@/app/components/ui/table";
import { useRefresh } from "@/hooks/use-refresh";
import {
	formatDateTime,
	formatTime,
	fromDateTimeLocalValue
} from "@/lib/datetime";
import { DEFAULT_FINALIST_COUNT } from "@/lib/judging";
import { api } from "@/trpc/react";
import {
	type FinalResults,
	type Layout,
	ManagementSection,
	type PanelRanking,
	type Round
} from "./judgingShared";

function formatScore(value: number | null, digits = 2) {
	return value === null ? "—" : value.toFixed(digits);
}

function topTeamIds(ranking: PanelRanking[], count: number) {
	return new Set(
		ranking
			.filter((entry) => entry.normalizedScore !== null)
			.slice(0, count)
			.map((entry) => entry.teamId)
	);
}

function FinalistPicker({
	ranking,
	hasFinalRound
}: {
	ranking: PanelRanking[];
	hasFinalRound: boolean;
}) {
	const { confirm, dialogProps } = useConfirmDialog();
	const { isRefreshing, refresh } = useRefresh();
	const [count, setCount] = useState(String(DEFAULT_FINALIST_COUNT));
	const [selected, setSelected] = useState(() =>
		topTeamIds(ranking, DEFAULT_FINALIST_COUNT)
	);
	const [startTime, setStartTime] = useState("");
	const [presentationMinutes, setPresentationMinutes] = useState("10");
	const [changeoverMinutes, setChangeoverMinutes] = useState("2");
	const [submitted, setSubmitted] = useState(false);
	const [message, setMessage] = useState("");
	const setFinalists = api.judgingResults.setFinalists.useMutation({
		onError: (error) => setMessage(error.message),
		onSuccess: () =>
			refresh(() =>
				setMessage("Final round created. Publish it below when you’re ready.")
			)
	});
	const busy = isRefreshing || setFinalists.isPending;

	const parsedStart = fromDateTimeLocalValue(startTime);
	const presentation = Number(presentationMinutes);
	const changeover = Number(changeoverMinutes);
	const errors = {
		finalists: selected.size === 0 ? "Pick at least one finalist." : "",
		startTime: parsedStart ? "" : "Choose a valid start time.",
		presentation:
			Number.isInteger(presentation) && presentation >= 1
				? ""
				: "Enter a whole number of minutes.",
		changeover:
			Number.isInteger(changeover) && changeover >= 0
				? ""
				: "Enter a whole number of minutes."
	};

	const submit = async () => {
		setSubmitted(true);
		setMessage("");
		if (busy || Object.values(errors).some(Boolean) || !parsedStart) return;
		if (
			hasFinalRound &&
			!(await confirm({
				title: "Replace the final round?",
				description:
					"The current finalists and times will be replaced, and the final round will be unpublished.",
				confirmLabel: "Replace"
			}))
		) {
			return;
		}
		setFinalists.mutate({
			teamIds: ranking
				.filter((entry) => selected.has(entry.teamId))
				.map((entry) => entry.teamId),
			startTime: parsedStart,
			presentationMinutes: presentation,
			changeoverMinutes: changeover
		});
	};

	return (
		<div className="flex flex-col gap-6">
			<ConfirmAlertDialog {...dialogProps} />
			<Table className="min-w-160">
				<TableHeader>
					<TableRow>
						<TableHead className="w-16 px-3 py-3">Rank</TableHead>
						<TableHead className="w-24 px-3 py-3">Finalist</TableHead>
						<TableHead className="px-3 py-3">Team</TableHead>
						<TableHead className="px-3 py-3 text-right">
							Normalized score
						</TableHead>
						<TableHead className="px-3 py-3 text-right">Raw average</TableHead>
						<TableHead className="px-3 py-3 text-right">Scorecards</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{ranking.map((entry, index) => (
						<TableRow key={entry.teamId}>
							<TableCell className="px-3 py-4 font-semibold text-primary">
								{entry.normalizedScore === null ? "—" : index + 1}
							</TableCell>
							<TableCell className="px-3 py-4">
								<Checkbox
									aria-label={`Select ${entry.teamName} as a finalist`}
									checked={selected.has(entry.teamId)}
									onCheckedChange={(checked) =>
										setSelected((current) => {
											const next = new Set(current);
											if (checked) next.add(entry.teamId);
											else next.delete(entry.teamId);
											return next;
										})
									}
								/>
							</TableCell>
							<TableCell className="wrap-break-word whitespace-normal px-3 py-4 font-medium">
								{entry.teamName}
							</TableCell>
							<TableCell className="px-3 py-4 text-right tabular-nums">
								{formatScore(entry.normalizedScore)}
							</TableCell>
							<TableCell className="px-3 py-4 text-right tabular-nums">
								{formatScore(entry.rawAverage)}
							</TableCell>
							<TableCell className="px-3 py-4 text-right tabular-nums">
								{entry.scorecardCount}/{entry.expectedScorecards}
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
			{ranking.length === 0 ? (
				<Empty>
					<EmptyHeader>
						<EmptyTitle>No results yet</EmptyTitle>
						<EmptyDescription>
							The ranking fills in as judges submit scorecards.
						</EmptyDescription>
					</EmptyHeader>
				</Empty>
			) : null}

			<form
				className="flex flex-col gap-4"
				noValidate
				onSubmit={(event) => {
					event.preventDefault();
					void submit();
				}}
			>
				<FieldGroup className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
					<Field className="gap-2">
						<FieldLabel htmlFor="finalist-count">
							Number of finalists
						</FieldLabel>
						<Input
							className="h-12"
							id="finalist-count"
							min={1}
							onChange={(event) => {
								setCount(event.target.value);
								const parsed = Number(event.target.value);
								if (Number.isInteger(parsed) && parsed >= 1) {
									setSelected(topTeamIds(ranking, parsed));
								}
							}}
							type="number"
							value={count}
						/>
					</Field>
					<Field
						className="gap-2"
						data-invalid={submitted && Boolean(errors.startTime)}
					>
						<FieldLabel htmlFor="final-start">Final round starts</FieldLabel>
						<Input
							aria-invalid={submitted && Boolean(errors.startTime)}
							className="h-12"
							id="final-start"
							onChange={(event) => setStartTime(event.target.value)}
							type="datetime-local"
							value={startTime}
						/>
						{submitted ? (
							<FieldError errors={[{ message: errors.startTime }]} />
						) : null}
					</Field>
					<Field
						className="gap-2"
						data-invalid={submitted && Boolean(errors.presentation)}
					>
						<FieldLabel htmlFor="final-presentation">
							Presentation (minutes)
						</FieldLabel>
						<Input
							aria-invalid={submitted && Boolean(errors.presentation)}
							className="h-12"
							id="final-presentation"
							min={1}
							onChange={(event) => setPresentationMinutes(event.target.value)}
							type="number"
							value={presentationMinutes}
						/>
						{submitted ? (
							<FieldError errors={[{ message: errors.presentation }]} />
						) : null}
					</Field>
					<Field
						className="gap-2"
						data-invalid={submitted && Boolean(errors.changeover)}
					>
						<FieldLabel htmlFor="final-changeover">
							Changeover (minutes)
						</FieldLabel>
						<Input
							aria-invalid={submitted && Boolean(errors.changeover)}
							className="h-12"
							id="final-changeover"
							min={0}
							onChange={(event) => setChangeoverMinutes(event.target.value)}
							type="number"
							value={changeoverMinutes}
						/>
						{submitted ? (
							<FieldError errors={[{ message: errors.changeover }]} />
						) : null}
					</Field>
				</FieldGroup>
				<div className="flex flex-wrap items-center justify-between gap-3">
					<p
						aria-live="polite"
						className="m-0 min-h-5 text-muted-foreground text-sm"
					>
						{(submitted && errors.finalists) ||
							message ||
							`${selected.size} finalist${selected.size === 1 ? "" : "s"} selected`}
					</p>
					<Button disabled={busy} type="submit">
						{hasFinalRound ? "Replace final round" : "Create final round"}
					</Button>
				</div>
			</form>
		</div>
	);
}

function FinalRound({
	round,
	layout,
	results
}: {
	round: Round;
	layout?: Layout;
	results: FinalResults;
}) {
	const { isRefreshing, refresh } = useRefresh();
	const [message, setMessage] = useState("");
	const onError = (error: { message: string }) => setMessage(error.message);
	const publish = api.judgingRounds.publish.useMutation({
		onError,
		onSuccess: () =>
			refresh(() => setMessage("Published. Finalists can now see their time."))
	});
	const unpublish = api.judgingRounds.unpublish.useMutation({
		onError,
		onSuccess: () => refresh(() => setMessage("Unpublished."))
	});
	const busy = isRefreshing || publish.isPending || unpublish.isPending;
	const finalists = (layout?.tables[0]?.assignments ?? [])
		.slice()
		.sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
	const judgeCount = layout?.tables[0]?.judges.length ?? 0;

	return (
		<div className="flex flex-col gap-6">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div className="flex flex-wrap items-center gap-2">
					<span className="font-medium">{formatDateTime(round.startTime)}</span>
					<span className="text-muted-foreground text-sm">
						{round.presentationMinutes}-minute presentations · {judgeCount}{" "}
						judges
					</span>
					{round.publishedAt ? (
						<Badge variant="secondary">Published</Badge>
					) : (
						<Badge variant="outline">Not published</Badge>
					)}
				</div>
				<Button
					disabled={busy}
					onClick={() =>
						round.publishedAt
							? unpublish.mutate({ id: round.id })
							: publish.mutate({ id: round.id })
					}
					type="button"
					variant="outline"
				>
					{round.publishedAt ? "Unpublish" : "Publish"}
				</Button>
			</div>
			<p
				aria-live="polite"
				className="m-0 min-h-5 text-muted-foreground text-sm"
			>
				{message}
			</p>
			<ol className="m-0 flex list-none flex-col gap-2 p-0">
				{finalists.map((assignment) => (
					<li className="flex gap-4" key={assignment.id}>
						<span className="w-20 shrink-0 text-muted-foreground tabular-nums">
							{formatTime(assignment.startsAt)}
						</span>
						<span className="font-medium">{assignment.team.name}</span>
						<span className="text-muted-foreground text-sm">
							until{" "}
							{formatTime(
								addMinutes(assignment.startsAt, round.presentationMinutes ?? 0)
							)}
						</span>
					</li>
				))}
			</ol>
			<div className="flex flex-col gap-3">
				<h3 className="m-0 font-medium text-base">Final results</h3>
				<p className="m-0 text-muted-foreground text-sm">
					Raw average of every judge’s main score. The final round alone decides
					the winner.
				</p>
				{results?.results.length ? (
					<Table className="min-w-120">
						<TableHeader>
							<TableRow>
								<TableHead className="w-16 px-3 py-3">Rank</TableHead>
								<TableHead className="px-3 py-3">Team</TableHead>
								<TableHead className="px-3 py-3 text-right">
									Average score
								</TableHead>
								<TableHead className="px-3 py-3 text-right">
									Scorecards
								</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{results.results.map((result, index) => (
								<TableRow key={result.teamId}>
									<TableCell className="px-3 py-4 font-semibold text-primary">
										{index + 1}
									</TableCell>
									<TableCell className="px-3 py-4 font-medium">
										{result.teamName}
									</TableCell>
									<TableCell className="px-3 py-4 text-right tabular-nums">
										{formatScore(result.rawAverage)}
									</TableCell>
									<TableCell className="px-3 py-4 text-right tabular-nums">
										{result.scorecardCount}/{judgeCount}
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				) : (
					<p className="m-0 text-sm">No final scorecards submitted yet.</p>
				)}
			</div>
		</div>
	);
}

export function FinalRoundManagement({
	rounds,
	layouts,
	rankings,
	finalResults
}: {
	rounds: Round[];
	layouts: Record<string, Layout>;
	rankings: Record<string, PanelRanking[]>;
	finalResults: FinalResults;
}) {
	const panelRounds = rounds.filter((round) => round.kind === "panel");
	const finalRound = rounds.find((round) => round.kind === "final");
	const [panelRoundId, setPanelRoundId] = useState(panelRounds[0]?.id ?? "");
	const panelRound =
		panelRounds.find((round) => round.id === panelRoundId) ?? panelRounds[0];

	return (
		<>
			<ManagementSection
				description="Teams are ranked by normalized score: each judge’s totals are compared against that judge’s own scores, so a lenient or strict table doesn’t decide who advances. The top teams are pre-selected; adjust the picks, then create the final round."
				id="panel-results"
				title="Panel results"
			>
				{panelRound ? (
					<div className="flex flex-col gap-6">
						{panelRounds.length > 1 ? (
							<Field className="w-full gap-2 sm:w-64">
								<FieldLabel htmlFor="results-round">Round</FieldLabel>
								<Select
									items={panelRounds.map((round) => ({
										value: round.id,
										label: round.name
									}))}
									onValueChange={(value) => {
										if (value) setPanelRoundId(value);
									}}
									value={panelRound.id}
								>
									<SelectTrigger className="h-12 w-full" id="results-round">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectGroup>
											{panelRounds.map((round) => (
												<SelectItem key={round.id} value={round.id}>
													{round.name}
												</SelectItem>
											))}
										</SelectGroup>
									</SelectContent>
								</Select>
							</Field>
						) : null}
						<FinalistPicker
							hasFinalRound={Boolean(finalRound)}
							key={panelRound.id}
							ranking={rankings[panelRound.id] ?? []}
						/>
					</div>
				) : (
					<Empty>
						<EmptyHeader>
							<EmptyTitle>No panel rounds yet</EmptyTitle>
							<EmptyDescription>
								Results appear here once a panel round has been scored.
							</EmptyDescription>
						</EmptyHeader>
					</Empty>
				)}
			</ManagementSection>
			<ManagementSection
				description="Every judge sits at one table and the finalists present one after another."
				id="final-round"
				title="Final round"
			>
				{finalRound ? (
					<FinalRound
						layout={layouts[finalRound.id]}
						results={finalResults}
						round={finalRound}
					/>
				) : (
					<Empty>
						<EmptyHeader>
							<EmptyTitle>No final round yet</EmptyTitle>
							<EmptyDescription>
								Pick finalists in the panel results above to create it.
							</EmptyDescription>
						</EmptyHeader>
					</Empty>
				)}
			</ManagementSection>
		</>
	);
}
