import { type ReactNode, useId } from "react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader
} from "@/app/components/ui/card";
import {
	formatDateTime,
	formatShortDate,
	formatTime,
	isSameCalgaryDay
} from "@/lib/datetime";
import type { RouterInputs, RouterOutputs } from "@/trpc/react";

export type Round = RouterOutputs["judgingRounds"]["getAll"][number];
export type Assignment = RouterOutputs["judgingAssignments"]["getAll"][number];
export type Layout = RouterOutputs["judgingTables"]["getLayoutByRound"];
export type LayoutTable = Layout["tables"][number];
// Each round's tables, by round ID.
export type Layouts = Record<string, Layout>;
export type Judge = RouterOutputs["users"]["getAll"][number];
export type Team = RouterOutputs["teams"]["getAll"][number];
export type Criterion = RouterOutputs["criteria"]["getAll"][number];
export type PanelRanking =
	RouterOutputs["judgingResults"]["getPanelRanking"][number];
export type FinalResults = RouterOutputs["judgingResults"]["getFinalResults"];
export type ScheduleSettings = Omit<
	RouterInputs["judgingTables"]["previewSchedule"],
	"roundId"
>;

export function byNameThenId<T extends { id: string; name: string }>(
	a: T,
	b: T
) {
	const nameSort = a.name.localeCompare(b.name);
	return nameSort || a.id.localeCompare(b.id);
}

export function formatRoundTimes({ startTime, endTime }: Round) {
	return isSameCalgaryDay(startTime, endTime)
		? `${formatShortDate(startTime)} · ${formatTime(startTime)} – ${formatTime(endTime)}`
		: `${formatDateTime(startTime)} – ${formatDateTime(endTime)}`;
}

export function formatScore(value: number | null) {
	return value === null ? "—" : value.toFixed(2);
}

export function plural(count: number, noun: string) {
	return `${count} ${noun}${count === 1 ? "" : "s"}`;
}

export function ManagementSection({
	action,
	children,
	description,
	title
}: {
	action?: ReactNode;
	children: ReactNode;
	description?: ReactNode;
	title: string;
}) {
	const titleId = useId();
	return (
		<section aria-labelledby={titleId}>
			<Card>
				<CardHeader className="flex flex-wrap items-start justify-between gap-3">
					<div className="flex min-w-0 flex-col gap-1">
						<h2 className="font-medium text-lg" id={titleId}>
							{title}
						</h2>
						{description ? (
							<CardDescription>{description}</CardDescription>
						) : null}
					</div>
					{action ? <div className="flex flex-wrap gap-2">{action}</div> : null}
				</CardHeader>
				<CardContent>{children}</CardContent>
			</Card>
		</section>
	);
}
