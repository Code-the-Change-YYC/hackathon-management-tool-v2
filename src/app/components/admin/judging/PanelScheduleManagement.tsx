"use client";

import { keepPreviousData } from "@tanstack/react-query";
import { addMinutes } from "date-fns";
import Link from "next/link";
import { useState } from "react";
import {
	ConfirmAlertDialog,
	useConfirmDialog
} from "@/app/components/ConfirmAlertDialog";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyTitle
} from "@/app/components/ui/empty";
import { Field, FieldGroup, FieldLabel } from "@/app/components/ui/field";
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
import { formatTime } from "@/lib/datetime";
import { cn } from "@/lib/utils";
import { api } from "@/trpc/react";
import {
	type Judge,
	type Layout,
	type Layouts,
	ManagementSection,
	type Round,
	type ScheduleSettings,
	type Team
} from "./judgingShared";

type Assignment = Layout["tables"][number]["assignments"][number];
type GridRow =
	| { kind: "slot"; startsAt: Date; cells: (Assignment | undefined)[] }
	| { kind: "break"; startsAt: Date; endsAt: Date };

const NOT_AT_A_TABLE = "none";

// Only sent while disabled, so the query input keeps one shape.
const SETTINGS_PLACEHOLDER: ScheduleSettings = {
	panelSize: 1,
	changeoverMinutes: 0,
	breakMinutes: 0,
	maxBlockMinutes: 1
};

const SETTING_FIELDS: {
	key: keyof ScheduleSettings;
	label: string;
	min: number;
}[] = [
	{ key: "panelSize", label: "Judges per table (minimum)", min: 1 },
	{ key: "changeoverMinutes", label: "Changeover (minutes)", min: 0 },
	{ key: "breakMinutes", label: "Break length (minutes)", min: 0 },
	{ key: "maxBlockMinutes", label: "Max continuous judging (minutes)", min: 1 }
];

function parseSettings(values: Record<keyof ScheduleSettings, string>) {
	const parsed = Object.fromEntries(
		SETTING_FIELDS.map(({ key }) => [key, Number(values[key])])
	) as ScheduleSettings;
	const valid = SETTING_FIELDS.every(
		({ key, min }) =>
			values[key].trim() !== "" &&
			Number.isInteger(parsed[key]) &&
			parsed[key] >= min
	);
	return valid ? parsed : null;
}

// Every table shares one timeline, so rows are the round's distinct start times.
function buildGrid(layout: Layout): GridRow[] {
	const { presentationMinutes, changeoverMinutes } = layout.round;
	const times = [
		...new Set(
			layout.tables.flatMap((table) =>
				table.assignments.map((assignment) => assignment.startsAt.getTime())
			)
		)
	].sort((a, b) => a - b);
	const slotMs = ((presentationMinutes ?? 0) + changeoverMinutes) * 60_000;

	return times.flatMap((time, index): GridRow[] => {
		const startsAt = new Date(time);
		const slot: GridRow = {
			kind: "slot",
			startsAt,
			cells: layout.tables.map((table) =>
				table.assignments.find(
					(assignment) => assignment.startsAt.getTime() === time
				)
			)
		};
		const previous = times[index - 1];
		if (previous === undefined || time - previous <= slotMs) return [slot];
		return [
			{
				kind: "break",
				startsAt: addMinutes(new Date(previous), presentationMinutes ?? 0),
				endsAt: startsAt
			},
			slot
		];
	});
}

function usePreview(roundId: string, settings: ScheduleSettings | null) {
	return api.judgingTables.previewSchedule.useQuery(
		{ roundId, ...(settings ?? SETTINGS_PLACEHOLDER) },
		{ enabled: Boolean(settings), placeholderData: keepPreviousData }
	);
}

function PreviewSummary({
	settings,
	preview
}: {
	settings: ScheduleSettings | null;
	preview: ReturnType<typeof usePreview>;
}) {
	if (!settings) {
		return (
			<p className="m-0 text-sm">Enter a whole number for each setting.</p>
		);
	}
	if (!preview.data) {
		return (
			<p className="m-0 text-muted-foreground text-sm">
				{preview.error ? preview.error.message : "Calculating…"}
			</p>
		);
	}

	const { judgeCount, teamCount, result } = preview.data;
	const counts = `${teamCount} prescreen-passed team${teamCount === 1 ? "" : "s"} · ${judgeCount} judge${judgeCount === 1 ? "" : "s"}`;
	if (!result.ok) {
		return (
			<div className="flex flex-col gap-1 text-sm">
				<p className="m-0 font-medium text-destructive">Doesn’t fit</p>
				<p className="m-0">{result.message}</p>
				<p className="m-0 text-muted-foreground">{counts}</p>
			</div>
		);
	}

	const { schedule } = result;
	return (
		<div className="flex flex-col gap-1 text-sm">
			<p className="m-0 font-medium">
				{schedule.tables.length} tables (
				{schedule.tables.map((table) => table.judgeIds.length).join(", ")}{" "}
				judges) · {schedule.presentationMinutes}-minute presentations ·{" "}
				{schedule.waveCount} waves
			</p>
			<p className="m-0 text-muted-foreground">
				{schedule.breaks.length
					? `Breaks at ${schedule.breaks.map((pause) => formatTime(pause.startsAt)).join(", ")}`
					: "No breaks needed"}{" "}
				· Ends {formatTime(schedule.endsAt)} · {counts}
			</p>
		</div>
	);
}

function PanelSchedule({
	round,
	layout,
	judges,
	teams
}: {
	round: Round;
	layout?: Layout;
	judges: Judge[];
	teams: Team[];
}) {
	const { confirm, dialogProps } = useConfirmDialog();
	const { isRefreshing, refresh } = useRefresh();
	const [message, setMessage] = useState("");
	const [values, setValues] = useState<Record<keyof ScheduleSettings, string>>({
		panelSize: String(round.panelSize ?? 4),
		changeoverMinutes: String(round.changeoverMinutes),
		breakMinutes: String(round.breakMinutes),
		maxBlockMinutes: String(round.maxBlockMinutes)
	});
	const [lateTeamId, setLateTeamId] = useState("");
	const [judgeId, setJudgeId] = useState("");
	const [destination, setDestination] = useState("");
	const settings = parseSettings(values);
	const preview = usePreview(round.id, settings);
	const fits =
		Boolean(settings) &&
		!preview.isPlaceholderData &&
		preview.data?.result.ok === true;
	const tables = layout?.tables ?? [];
	const hasSchedule = tables.length > 0;
	const scheduledTeamIds = new Set(
		tables.flatMap((table) =>
			table.assignments.map((assignment) => assignment.team.id)
		)
	);
	const lateTeams = teams.filter(
		(team) =>
			team.prescreenStatus === "passed" && !scheduledTeamIds.has(team.id)
	);

	const onError = (error: { message: string }) => setMessage(error.message);
	const generate = api.judgingTables.generateSchedule.useMutation({
		onError,
		onSuccess: (schedule) =>
			refresh(() =>
				setMessage(
					`Generated ${schedule.tables.length} tables with ${schedule.presentationMinutes}-minute presentations.`
				)
			)
	});
	const publish = api.judgingRounds.publish.useMutation({
		onError,
		onSuccess: () =>
			refresh(() => setMessage("Published. Teams can now see their times."))
	});
	const unpublish = api.judgingRounds.unpublish.useMutation({
		onError,
		onSuccess: () =>
			refresh(() => setMessage("Unpublished. Teams no longer see times."))
	});
	const removeTeam = api.judgingTables.removeTeam.useMutation({
		onError,
		onSuccess: () =>
			refresh(() => setMessage("Team removed from the schedule."))
	});
	const addTeam = api.judgingTables.addTeam.useMutation({
		onError,
		onSuccess: () =>
			refresh(() => {
				setLateTeamId("");
				setMessage("Team added to two free slots.");
			})
	});
	const assignJudge = api.judgingTables.assignJudge.useMutation({
		onError,
		onSuccess: () =>
			refresh(() => {
				setJudgeId("");
				setDestination("");
				setMessage("Judge moved.");
			})
	});
	const busy =
		isRefreshing ||
		generate.isPending ||
		publish.isPending ||
		unpublish.isPending ||
		removeTeam.isPending ||
		addTeam.isPending ||
		assignJudge.isPending;

	const handleGenerate = async () => {
		if (!settings || !fits || busy) return;
		setMessage("");
		if (
			hasSchedule &&
			!(await confirm(
				round.publishedAt
					? {
							title: "Regenerate the published schedule?",
							description:
								"Every team’s judging time and tables will change, and teams have already seen the current times.",
							confirmLabel: "Regenerate",
							destructive: true
						}
					: {
							title: "Replace the current schedule?",
							description: "The current tables and times will be replaced.",
							confirmLabel: "Replace"
						}
			))
		) {
			return;
		}
		generate.mutate({
			roundId: round.id,
			...settings,
			confirm: Boolean(round.publishedAt)
		});
	};

	const handleRemove = async (assignment: Assignment) => {
		if (busy) return;
		if (
			await confirm({
				title: `Remove ${assignment.team.name}?`,
				description:
					"Both of the team’s slots become free time. Nobody else’s time changes.",
				confirmLabel: "Remove",
				destructive: true
			})
		) {
			setMessage("");
			removeTeam.mutate({ roundId: round.id, teamId: assignment.team.id });
		}
	};

	return (
		<div className="flex flex-col gap-6">
			<ConfirmAlertDialog {...dialogProps} />
			<FieldGroup className="grid gap-4 sm:grid-cols-2 sm:items-end lg:grid-cols-4">
				{SETTING_FIELDS.map(({ key, label, min }) => (
					<Field className="gap-2" key={key}>
						<FieldLabel htmlFor={`schedule-${key}`}>{label}</FieldLabel>
						<Input
							className="h-12"
							id={`schedule-${key}`}
							min={min}
							onChange={(event) =>
								setValues((current) => ({
									...current,
									[key]: event.target.value
								}))
							}
							type="number"
							value={values[key]}
						/>
					</Field>
				))}
			</FieldGroup>

			<div className="flex flex-col gap-4 rounded-lg bg-muted/50 p-4 sm:flex-row sm:items-center sm:justify-between">
				<PreviewSummary preview={preview} settings={settings} />
				<div className="flex shrink-0 flex-wrap gap-2">
					<Button
						disabled={!fits || busy}
						onClick={() => void handleGenerate()}
						type="button"
					>
						{generate.isPending
							? "Generating…"
							: hasSchedule
								? "Regenerate"
								: "Generate schedule"}
					</Button>
					{hasSchedule ? (
						round.publishedAt ? (
							<Button
								disabled={busy}
								onClick={() => unpublish.mutate({ id: round.id })}
								type="button"
								variant="outline"
							>
								Unpublish
							</Button>
						) : (
							<Button
								disabled={busy}
								onClick={() => publish.mutate({ id: round.id })}
								type="button"
								variant="outline"
							>
								Publish
							</Button>
						)
					) : null}
				</div>
			</div>

			<p
				aria-live="polite"
				className="m-0 min-h-5 text-muted-foreground text-sm"
			>
				{message}
			</p>

			{hasSchedule && layout ? (
				<>
					<div className="flex flex-wrap items-center gap-2">
						<h3 className="m-0 font-medium text-base">Schedule</h3>
						{round.publishedAt ? (
							<Badge variant="secondary">Published</Badge>
						) : (
							<Badge variant="outline">Not published</Badge>
						)}
						{round.presentationMinutes ? (
							<span className="text-muted-foreground text-sm">
								{round.presentationMinutes}-minute presentations
							</span>
						) : null}
					</div>
					<Table className="min-w-max">
						<TableHeader>
							<TableRow>
								<TableHead className="px-3 py-3">Time</TableHead>
								{tables.map((table) => (
									<TableHead
										className="h-auto px-3 py-3 align-top"
										key={table.id}
									>
										Table {table.tableNumber}
										<span className="block font-normal text-muted-foreground text-xs">
											{table.judges.map(({ judge }) => judge.name).join(", ") ||
												"No judges"}
										</span>
									</TableHead>
								))}
							</TableRow>
						</TableHeader>
						<TableBody>
							{buildGrid(layout).map((row) =>
								row.kind === "break" ? (
									<TableRow key={`break-${row.startsAt.getTime()}`}>
										<TableCell
											className="bg-muted/50 px-3 py-2 text-muted-foreground"
											colSpan={tables.length + 1}
										>
											Break · {formatTime(row.startsAt)}–
											{formatTime(row.endsAt)}
										</TableCell>
									</TableRow>
								) : (
									<TableRow key={row.startsAt.getTime()}>
										<TableCell className="px-3 py-3 tabular-nums">
											{formatTime(row.startsAt)}
										</TableCell>
										{row.cells.map((assignment, index) => (
											<TableCell
												className={cn(
													"px-3 py-3",
													!assignment && "text-muted-foreground"
												)}
												key={tables[index]?.id}
											>
												{assignment ? (
													<span className="flex items-center justify-between gap-2">
														<span>{assignment.team.name}</span>
														<Button
															aria-label={`Remove ${assignment.team.name} from the schedule`}
															disabled={busy}
															onClick={() => void handleRemove(assignment)}
															size="xs"
															type="button"
															variant="ghost"
														>
															Remove
														</Button>
													</span>
												) : (
													"Free"
												)}
											</TableCell>
										))}
									</TableRow>
								)
							)}
						</TableBody>
					</Table>

					<div className="grid gap-6 lg:grid-cols-2">
						<form
							className="flex flex-col gap-3"
							onSubmit={(event) => {
								event.preventDefault();
								if (!lateTeamId || busy) return;
								setMessage("");
								addTeam.mutate({ roundId: round.id, teamId: lateTeamId });
							}}
						>
							<h3 className="m-0 font-medium text-base">Add a late team</h3>
							<Field className="gap-2">
								<FieldLabel htmlFor="late-team">Team</FieldLabel>
								<Select
									items={lateTeams.map((team) => ({
										value: team.id,
										label: team.name
									}))}
									onValueChange={(value) => setLateTeamId(value ?? "")}
									value={lateTeamId}
								>
									<SelectTrigger className="h-12 w-full" id="late-team">
										<SelectValue
											placeholder={
												lateTeams.length
													? "Select a team"
													: "No unscheduled passed teams"
											}
										/>
									</SelectTrigger>
									<SelectContent>
										<SelectGroup>
											{lateTeams.map((team) => (
												<SelectItem key={team.id} value={team.id}>
													{team.name}
												</SelectItem>
											))}
										</SelectGroup>
									</SelectContent>
								</Select>
							</Field>
							<Button
								className="self-start"
								disabled={!lateTeamId || busy}
								type="submit"
								variant="outline"
							>
								Add to free slots
							</Button>
						</form>

						<form
							className="flex flex-col gap-3"
							onSubmit={(event) => {
								event.preventDefault();
								if (!judgeId || !destination || busy) return;
								setMessage("");
								assignJudge.mutate({
									roundId: round.id,
									judgeId,
									tableId: destination === NOT_AT_A_TABLE ? null : destination
								});
							}}
						>
							<h3 className="m-0 font-medium text-base">Move a judge</h3>
							<div className="grid gap-3 sm:grid-cols-2">
								<Field className="gap-2">
									<FieldLabel htmlFor="move-judge">Judge</FieldLabel>
									<Select
										items={judges.map((judge) => ({
											value: judge.id,
											label: judge.name
										}))}
										onValueChange={(value) => setJudgeId(value ?? "")}
										value={judgeId}
									>
										<SelectTrigger className="h-12 w-full" id="move-judge">
											<SelectValue placeholder="Select a judge" />
										</SelectTrigger>
										<SelectContent>
											<SelectGroup>
												{judges.map((judge) => (
													<SelectItem key={judge.id} value={judge.id}>
														{judge.name}
													</SelectItem>
												))}
											</SelectGroup>
										</SelectContent>
									</Select>
								</Field>
								<Field className="gap-2">
									<FieldLabel htmlFor="move-judge-table">Move to</FieldLabel>
									<Select
										items={[
											...tables.map((table) => ({
												value: table.id,
												label: `Table ${table.tableNumber}`
											})),
											{ value: NOT_AT_A_TABLE, label: "Not at a table" }
										]}
										onValueChange={(value) => setDestination(value ?? "")}
										value={destination}
									>
										<SelectTrigger
											className="h-12 w-full"
											id="move-judge-table"
										>
											<SelectValue placeholder="Select a table" />
										</SelectTrigger>
										<SelectContent>
											<SelectGroup>
												{tables.map((table) => (
													<SelectItem key={table.id} value={table.id}>
														Table {table.tableNumber}
													</SelectItem>
												))}
												<SelectItem value={NOT_AT_A_TABLE}>
													Not at a table
												</SelectItem>
											</SelectGroup>
										</SelectContent>
									</Select>
								</Field>
							</div>
							<Button
								className="self-start"
								disabled={!judgeId || !destination || busy}
								type="submit"
								variant="outline"
							>
								Move judge
							</Button>
						</form>
					</div>
				</>
			) : null}
		</div>
	);
}

export function PanelScheduleManagement({
	rounds,
	activeRoundId,
	layouts,
	judges,
	teams
}: {
	rounds: Round[];
	activeRoundId: string | null;
	layouts: Layouts;
	judges: Judge[];
	teams: Team[];
}) {
	const panelRounds = rounds.filter((round) => round.kind === "panel");
	const [selectedRoundId, setSelectedRoundId] = useState(
		() =>
			(
				panelRounds.find((round) => round.id === activeRoundId) ??
				panelRounds[0]
			)?.id ?? ""
	);
	const round =
		panelRounds.find((candidate) => candidate.id === selectedRoundId) ??
		panelRounds[0];

	return (
		<ManagementSection
			description="Set the panel size and timing, check the preview, then generate. Each team presents back-to-back at two tables. After publishing, remove or add teams and move judges without reshuffling anyone else."
			id="panel-schedule"
			title="Panel schedule"
		>
			{round ? (
				<div className="flex flex-col gap-6">
					{panelRounds.length > 1 ? (
						<Field className="w-full gap-2 sm:w-64">
							<FieldLabel htmlFor="panel-round">Round</FieldLabel>
							<Select
								items={panelRounds.map((candidate) => ({
									value: candidate.id,
									label: candidate.name
								}))}
								onValueChange={(value) => {
									if (value) setSelectedRoundId(value);
								}}
								value={round.id}
							>
								<SelectTrigger className="h-12 w-full" id="panel-round">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectGroup>
										{panelRounds.map((candidate) => (
											<SelectItem key={candidate.id} value={candidate.id}>
												{candidate.name}
											</SelectItem>
										))}
									</SelectGroup>
								</SelectContent>
							</Select>
						</Field>
					) : null}
					{teams.every((team) => team.prescreenStatus !== "passed") ? (
						<p className="m-0 text-muted-foreground text-sm">
							No passed teams yet.{" "}
							<Link
								className="text-primary underline-offset-4 hover:underline"
								href="/admin/teams"
							>
								Prescreen teams
							</Link>{" "}
							before generating a schedule.
						</p>
					) : null}
					<PanelSchedule
						judges={judges}
						key={round.id}
						layout={layouts[round.id]}
						round={round}
						teams={teams}
					/>
				</div>
			) : (
				<Empty>
					<EmptyHeader>
						<EmptyTitle>No panel rounds yet</EmptyTitle>
						<EmptyDescription>
							Add a round above, then generate its schedule here.
						</EmptyDescription>
					</EmptyHeader>
				</Empty>
			)}
		</ManagementSection>
	);
}
