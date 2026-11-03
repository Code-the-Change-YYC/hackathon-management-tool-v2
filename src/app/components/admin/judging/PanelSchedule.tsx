"use client";

import { CloseLine } from "@mingcute/react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import {
	ConfirmAlertDialog,
	useConfirmDialog
} from "@/app/components/ConfirmAlertDialog";
import { Button, buttonVariants } from "@/app/components/ui/button";
import {
	Empty,
	EmptyContent,
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
import { cn } from "@/lib/utils";
import { api } from "@/trpc/react";
import { AddTeamDialog } from "./AddTeamDialog";
import {
	type Judge,
	type Layout,
	ManagementSection,
	plural,
	type Round,
	type Team
} from "./judgingShared";
import { MoveJudgeDialog } from "./MoveJudgeDialog";
import { ScheduleDialog } from "./ScheduleDialog";

type Assignment = Layout["tables"][number]["assignments"][number];
type GridRow =
	| { kind: "slot"; startsAt: Date; cells: (Assignment | undefined)[] }
	| { kind: "break"; startsAt: Date; endsAt: Date };

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
				// Breaks start when the slot before them ends, as when generated.
				startsAt: new Date(previous + slotMs),
				endsAt: startsAt
			},
			slot
		];
	});
}

function scoringStatus(assignment: Assignment, judgeCount: number) {
	if (judgeCount > 0 && assignment.scoredJudgeCount === judgeCount) {
		return "complete";
	}
	return assignment.scoredJudgeCount > 0 ? "partial" : "none";
}

type OpenDialog = "generate" | "addTeam" | "moveJudge" | null;

export function PanelSchedule({
	round,
	layout,
	judges,
	teams,
	hasScores
}: {
	round: Round;
	layout?: Layout;
	judges: Judge[];
	teams: Team[];
	hasScores: boolean;
}) {
	const { confirm, dialogProps } = useConfirmDialog();
	const { isRefreshing, refresh } = useRefresh();
	const [openDialog, setOpenDialog] = useState<OpenDialog>(null);
	const removeTeam = api.judgingTables.removeTeam.useMutation({
		onError: (error) => toast.error(error.message),
		onSuccess: () =>
			refresh(() => toast.success("Team removed from the schedule."))
	});
	const tables = layout?.tables ?? [];
	const hasSchedule = tables.length > 0;
	const passedTeams = teams.filter((team) => team.prescreenStatus === "passed");
	const scheduledTeamIds = new Set(
		tables.flatMap((table) =>
			table.assignments.map((assignment) => assignment.team.id)
		)
	);
	const unscheduledTeams = passedTeams.filter(
		(team) => !scheduledTeamIds.has(team.id)
	);
	// Scores keep a team in the schedule, so only unscored teams can be removed.
	const scoredTeamIds = new Set(
		tables.flatMap((table) =>
			table.assignments
				.filter((assignment) => assignment.scoredJudgeCount > 0)
				.map((assignment) => assignment.team.id)
		)
	);

	async function requestRemove(assignment: Assignment) {
		const confirmed = await confirm({
			title: `Remove ${assignment.team.name}?`,
			description:
				"Both of the team’s slots become free. Nobody else’s time changes.",
			confirmLabel: "Remove",
			destructive: true
		});
		if (confirmed) {
			removeTeam.mutate({ roundId: round.id, teamId: assignment.team.id });
		}
	}

	return (
		<ManagementSection
			action={
				hasSchedule ? (
					<>
						<Button
							onClick={() => setOpenDialog("addTeam")}
							size="sm"
							variant="outline"
						>
							Add team
						</Button>
						<Button
							onClick={() => setOpenDialog("moveJudge")}
							size="sm"
							variant="outline"
						>
							Move judge
						</Button>
						<Button
							disabled={hasScores}
							onClick={() => setOpenDialog("generate")}
							size="sm"
							title={
								hasScores ? "Scored rounds can’t be regenerated." : undefined
							}
							variant="outline"
						>
							Regenerate
						</Button>
					</>
				) : null
			}
			description={
				hasSchedule && round.presentationMinutes
					? `${plural(tables.length, "table")} · ${round.presentationMinutes}-minute presentations`
					: undefined
			}
			title="Schedule"
		>
			{hasSchedule && layout ? (
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
										Break · {formatTime(row.startsAt)} –{" "}
										{formatTime(row.endsAt)}
									</TableCell>
								</TableRow>
							) : (
								<TableRow key={row.startsAt.getTime()}>
									<TableCell className="px-3 py-2 tabular-nums">
										{formatTime(row.startsAt)}
									</TableCell>
									{row.cells.map((assignment, index) => {
										const status = assignment
											? scoringStatus(
													assignment,
													tables[index]?.judges.length ?? 0
												)
											: "none";
										return (
											<TableCell className="p-0.5" key={tables[index]?.id}>
												{assignment ? (
													<span
														className={cn(
															"flex items-center justify-between gap-2 rounded-md py-1 pl-2",
															status === "partial" && "bg-accent text-primary",
															status === "complete" &&
																"bg-primary text-primary-foreground"
														)}
													>
														{assignment.team.prescreenStatus === "failed" ? (
															<span
																className="line-through"
																title="Failed pre-screening, so not ranked"
															>
																{assignment.team.name}
																<span className="sr-only">
																	{" "}
																	(failed pre-screening)
																</span>
															</span>
														) : (
															assignment.team.name
														)}
														{scoredTeamIds.has(assignment.team.id) ? null : (
															<Button
																aria-label={`Remove ${assignment.team.name} from the schedule`}
																className="text-muted-foreground"
																disabled={removeTeam.isPending || isRefreshing}
																onClick={() => void requestRemove(assignment)}
																size="icon-xs"
																title="Remove from the schedule"
																variant="ghost"
															>
																<CloseLine />
															</Button>
														)}
													</span>
												) : (
													<span className="block py-1 pl-2 text-muted-foreground">
														Free
													</span>
												)}
											</TableCell>
										);
									})}
								</TableRow>
							)
						)}
					</TableBody>
				</Table>
			) : (
				<Empty>
					<EmptyHeader>
						<EmptyTitle>No schedule yet</EmptyTitle>
						<EmptyDescription>
							{passedTeams.length
								? `Generate tables and times for the ${plural(passedTeams.length, "team")} that passed prescreening.`
								: "No teams have passed prescreening yet."}
						</EmptyDescription>
					</EmptyHeader>
					<EmptyContent>
						{passedTeams.length ? (
							<Button onClick={() => setOpenDialog("generate")}>
								Generate schedule
							</Button>
						) : (
							<Link
								className={buttonVariants({ variant: "outline" })}
								href="/admin/teams"
							>
								Prescreen teams
							</Link>
						)}
					</EmptyContent>
				</Empty>
			)}
			{openDialog === "generate" ? (
				<ScheduleDialog
					hasSchedule={hasSchedule}
					onClose={() => setOpenDialog(null)}
					round={round}
				/>
			) : null}
			{openDialog === "addTeam" ? (
				<AddTeamDialog
					onClose={() => setOpenDialog(null)}
					round={round}
					teams={unscheduledTeams}
				/>
			) : null}
			{openDialog === "moveJudge" ? (
				<MoveJudgeDialog
					judges={judges}
					onClose={() => setOpenDialog(null)}
					round={round}
					tables={tables}
				/>
			) : null}
			<ConfirmAlertDialog {...dialogProps} />
		</ManagementSection>
	);
}
