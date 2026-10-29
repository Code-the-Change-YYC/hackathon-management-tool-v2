import {
	type Criterion,
	getCriterionDescription
} from "@/app/components/judge/judgePortal";
import {
	AccordionContent,
	AccordionItem,
	AccordionTrigger
} from "@/app/components/ui/accordion";
import { getRubricBands, type RubricBandLabel } from "@/lib/judging";
import { cn } from "@/lib/utils";

// Stronger bands get a stronger shade of the brand purple.
const bandFills: Record<RubricBandLabel, string> = {
	Minimal: "bg-primary/20",
	Developing: "bg-primary/40",
	Satisfactory: "bg-primary/60",
	Effective: "bg-primary/80",
	Excellent: "bg-primary"
};

function ScoreBar({ value, max }: { value: number; max: number }) {
	return (
		<span
			aria-hidden
			className="hidden h-1.5 w-24 shrink-0 overflow-hidden rounded-full bg-primary/15 sm:block"
		>
			<span
				className="block h-full rounded-full bg-primary"
				style={{
					width: `${Math.min(100, Math.max(0, (value / Math.max(1, max)) * 100))}%`
				}}
			/>
		</span>
	);
}

function ScoringScale({
	criterion,
	score
}: {
	criterion: Criterion;
	score?: number;
}) {
	return (
		<div className="@container/scale">
			<ol
				aria-label={`${criterion.name} scoring scale`}
				className="m-0 grid @min-[28rem]/scale:auto-cols-fr @min-[28rem]/scale:grid-flow-col @min-[28rem]/scale:grid-cols-none grid-cols-1 gap-1 p-0"
			>
				{getRubricBands(criterion.maxScore).map((band) => {
					// Scores can be fractional averages, so a band covers everything above the one below it.
					const containsScore =
						score !== undefined && score > band.min - 1 && score <= band.max;
					return (
						<li
							className={cn(
								"flex @min-[28rem]/scale:flex-col items-center @min-[28rem]/scale:items-stretch gap-x-3 gap-y-2 rounded-lg p-2",
								containsScore && "bg-card ring-1 ring-primary"
							)}
							key={band.label}
						>
							<span
								aria-hidden
								className={cn(
									"h-1.5 @min-[28rem]/scale:w-full w-8 shrink-0 rounded-full",
									bandFills[band.label]
								)}
							/>
							<span className="flex @min-[28rem]/scale:flex-col items-baseline @min-[28rem]/scale:gap-0 gap-2">
								<span className="@min-[28rem]/scale:w-auto w-12 whitespace-nowrap font-semibold text-base tabular-nums">
									{band.range}
								</span>
								<span
									className={cn(
										"text-xs",
										containsScore
											? "font-medium text-foreground"
											: "text-muted-foreground"
									)}
								>
									{band.label}
								</span>
							</span>
						</li>
					);
				})}
			</ol>
		</div>
	);
}

export function RubricCriterion({
	criterion,
	number,
	score,
	isSidepot = false
}: {
	criterion: Criterion;
	number: number;
	score?: number;
	isSidepot: boolean;
}) {
	return (
		<AccordionItem
			className="px-4 transition-colors duration-200 ease-out hover:bg-muted/30 data-open:bg-muted/30"
			value={criterion.id}
		>
			<AccordionTrigger className="items-center gap-3 py-4">
				{!isSidepot && (
					<span
						aria-hidden
						className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary font-semibold text-white/80 text-xs tabular-nums"
					>
						{number}
					</span>
				)}
				<span className="wrap-break-word min-w-0 flex-1">{criterion.name}</span>
				{score === undefined ? (
					<span className="shrink-0 whitespace-nowrap text-muted-foreground text-xs tabular-nums">
						{criterion.maxScore} points
					</span>
				) : (
					<>
						<ScoreBar max={criterion.maxScore} value={score} />
						<span className="shrink-0 whitespace-nowrap text-sm tabular-nums">
							{`${Number(score.toFixed(2))} / ${criterion.maxScore}`}
						</span>
					</>
				)}
			</AccordionTrigger>
			<AccordionContent className="pb-4">
				{!criterion.description.trim() ? (
					<p className="max-w-prose text-muted-foreground text-sm">
						No criterion-specific description has been provided, so general
						guidance is shown instead.
					</p>
				) : null}
				<p className="wrap-break-word max-w-prose whitespace-pre-line text-sm leading-relaxed">
					{getCriterionDescription(criterion)}
				</p>
				<ScoringScale criterion={criterion} score={score} />
			</AccordionContent>
		</AccordionItem>
	);
}
