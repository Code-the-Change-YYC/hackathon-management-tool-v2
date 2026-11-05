import { ArrowDownLine, TrophyLine } from "@mingcute/react";
import { useId } from "react";
import {
	Avatar,
	AvatarFallback,
	AvatarImage
} from "@/app/components/ui/avatar";
import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { Skeleton } from "@/app/components/ui/skeleton";
import { resolveAvatarSrc } from "@/lib/avatars";
import { getInitials } from "@/lib/names";
import { cn } from "@/lib/utils";
import type { getJudgeTable } from "../judgePortal";

type JudgeTable = NonNullable<ReturnType<typeof getJudgeTable>>;

const MAX_JUDGE_CHIPS = 3;
const chipClass =
	"flex min-h-8 items-center gap-2 rounded-full bg-muted/50 py-1 font-medium text-sm";
const cardClass =
	"flex-row flex-wrap items-center gap-x-6 gap-y-4 px-4 py-4 sm:px-6";

function TableBadge({ table }: { table: JudgeTable }) {
	return (
		<span
			aria-hidden
			className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-fuzzy-peach font-semibold text-2xl text-grapefruit"
		>
			{table.number}
		</span>
	);
}

function OtherJudges({ judges }: { judges: JudgeTable["otherJudges"] }) {
	if (judges.length === 0) {
		return (
			<p className="m-0 text-muted-foreground text-sm">
				You’re the only judge at this table.
			</p>
		);
	}

	// A "+1 other" chip takes as much room as the judge it hides, so only
	// collapse when it saves at least two chips.
	const shown =
		judges.length > MAX_JUDGE_CHIPS + 1
			? judges.slice(0, MAX_JUDGE_CHIPS)
			: judges;
	const hiddenCount = judges.length - shown.length;

	return (
		<div className="flex flex-col gap-2">
			<p className="m-0 text-muted-foreground text-sm">Judging with</p>
			<ul className="m-0 flex list-none flex-wrap gap-2 p-0">
				{shown.map((judge) => (
					<li className={cn(chipClass, "pr-3 pl-1")} key={judge.id}>
						<Avatar size="sm">
							<AvatarImage alt="" src={resolveAvatarSrc(judge.image)} />
							<AvatarFallback>{getInitials(judge.name)}</AvatarFallback>
						</Avatar>
						{judge.name}
					</li>
				))}
				{hiddenCount > 0 && (
					<li className={cn(chipClass, "px-3 text-muted-foreground")}>
						+{hiddenCount} others
					</li>
				)}
			</ul>
		</div>
	);
}

export function JudgeTableCard({
	table,
	roundName
}: {
	table: JudgeTable;
	roundName: string;
}) {
	const titleId = useId();

	return (
		<Card aria-labelledby={titleId} className={cardClass} role="region">
			<div className="flex items-center gap-4">
				<TableBadge table={table} />
				<div className="flex flex-col">
					<p className="m-0 text-muted-foreground text-sm">
						Your table for {roundName}
					</p>
					<h2 className="m-0 font-semibold text-2xl" id={titleId}>
						{table.name}
					</h2>
				</div>
			</div>
			<div className="sm:ml-auto">
				<OtherJudges judges={table.otherJudges} />
			</div>
		</Card>
	);
}

export function FinalRoundCard({ sectionId }: { sectionId: string }) {
	const titleId = useId();

	function scrollToFinalRound() {
		const reduceMotion = window.matchMedia(
			"(prefers-reduced-motion: reduce)"
		).matches;
		document.getElementById(sectionId)?.scrollIntoView({
			behavior: reduceMotion ? "auto" : "smooth",
			block: "start"
		});
	}

	return (
		<Card aria-labelledby={titleId} className={cardClass} role="region">
			<div className="flex items-center gap-4">
				<span
					aria-hidden
					className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-fuzzy-peach text-grapefruit"
				>
					<TrophyLine className="size-7" />
				</span>
				<div className="flex flex-col gap-1">
					<h2 className="m-0 font-semibold text-xl" id={titleId}>
						It’s time for the final round of judging
					</h2>
					<p className="m-0 text-muted-foreground text-sm">
						Finalists will present to all judges for final judging.
					</p>
				</div>
			</div>
			<Button className="sm:ml-auto" onClick={scrollToFinalRound}>
				Go to final round
				<ArrowDownLine className="size-5" data-icon="inline-end" />
			</Button>
		</Card>
	);
}

export function JudgeTableCardSkeleton() {
	return (
		<Card className={cardClass}>
			<div className="flex items-center gap-4">
				<Skeleton className="size-14 rounded-xl" />
				<div className="flex flex-col gap-2">
					<Skeleton className="h-3 w-32" />
					<Skeleton className="h-6 w-24" />
				</div>
			</div>
			<div className="flex flex-col gap-2 sm:ml-auto">
				<Skeleton className="h-3 w-20" />
				<Skeleton className="h-8 w-40 rounded-full" />
			</div>
		</Card>
	);
}
