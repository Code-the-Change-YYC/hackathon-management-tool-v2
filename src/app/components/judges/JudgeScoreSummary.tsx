"use client";
import { Badge } from "@/app/components/ui/badge";
import { cn } from "@/lib/utils";
import {
	type Criterion,
	getDraftScore,
	getScoreFillClass,
	getScoreTextColor,
	getScoreTone
} from "./useJudgePortalData";
export function ScoreTotal({
	criteria,
	scores
}: {
	criteria: Criterion[];
	scores: Record<string, number>;
}) {
	const mainCriteria = criteria.filter((criterion) => !criterion.isSidepot);
	const total = mainCriteria.reduce(
		(sum, criterion) => sum + (getDraftScore(scores, criterion.id) ?? 0),
		0
	);
	const max = mainCriteria.length * 10;

	return (
		<div className="flex flex-col items-end text-center font-medium">
			<p className="m-0 text-[0px] text-black leading-none">
				<output aria-label="Main score total" className="text-[22px] leading-7">
					{total}
				</output>
				<span className="text-grey-400 text-sm leading-5">/{max}</span>
			</p>
			<p className="m-0 text-[#434343] text-[9px] uppercase leading-3.5">
				Main total
			</p>
		</div>
	);
}

function SidepotBadge({
	criterion,
	score
}: {
	criterion: Criterion;
	score?: number;
}) {
	const scored = score !== undefined;
	return (
		<Badge
			className={cn(
				"h-auto gap-1.5 rounded-full px-2 py-1 text-[11px]",
				scored
					? getScoreTone(score, criterion.maxScore)
					: "border-grey-400 bg-background text-foreground"
			)}
			variant="outline"
		>
			<span className="size-1.5 rounded-full bg-current" />
			<span className="font-medium">{criterion.name}</span>
			<Badge
				className={cn(
					"h-auto rounded-full px-2 py-px font-semibold text-[10px]",
					scored
						? getScoreFillClass(score, criterion.maxScore)
						: "bg-grey-400 text-white hover:bg-grey-400"
				)}
			>
				{scored ? `${score}/${criterion.maxScore}` : `/${criterion.maxScore}`}
			</Badge>
		</Badge>
	);
}

function ScoreTile({
	criterion,
	score
}: {
	criterion: Criterion;
	score?: number;
}) {
	return (
		<div className="flex w-16 flex-col items-center gap-0.5 px-1 text-center">
			<p
				className={`m-0 font-medium text-base leading-6 ${
					score === undefined
						? "text-grey-400"
						: getScoreTextColor(score, criterion.maxScore)
				}`}
			>
				{score ?? "–"}
			</p>
			<p className="m-0 truncate text-[9px] text-grey-800 uppercase leading-3.5">
				{criterion.name}
			</p>
		</div>
	);
}

export function JudgeScoreSummary({
	criteria,
	mainCriteria,
	scores,
	sidepotCriteria
}: {
	criteria: Criterion[];
	mainCriteria: Criterion[];
	scores: Record<string, number>;
	sidepotCriteria: Criterion[];
}) {
	return (
		<section className="rounded-[10px] bg-white px-3 py-4">
			<h3 className="m-0 font-medium text-base text-black leading-6">
				Score Summary
			</h3>
			<div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-center">
				<div className="flex flex-wrap gap-3">
					{sidepotCriteria.map((criterion) => (
						<SidepotBadge
							criterion={criterion}
							key={criterion.id}
							score={getDraftScore(scores, criterion.id)}
						/>
					))}
				</div>
				<div className="flex flex-1 flex-col gap-3 border-grey-200 border-t pt-3 lg:flex-row lg:items-center lg:border-t-0 lg:border-l lg:pt-0 lg:pl-4">
					<div className="flex flex-1 flex-wrap justify-between gap-2">
						{mainCriteria.map((criterion) => (
							<ScoreTile
								criterion={criterion}
								key={criterion.id}
								score={getDraftScore(scores, criterion.id)}
							/>
						))}
					</div>
					<div className="border-grey-200 border-t pt-2 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-4">
						<ScoreTotal criteria={criteria} scores={scores} />
					</div>
				</div>
			</div>
		</section>
	);
}
