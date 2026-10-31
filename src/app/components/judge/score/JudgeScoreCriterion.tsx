"use client";
import { Badge } from "@/app/components/ui/badge";
import {
	Field,
	FieldDescription,
	FieldGroup,
	FieldLabel
} from "@/app/components/ui/field";
import { ToggleGroup, ToggleGroupItem } from "@/app/components/ui/toggle-group";
import { getRubricBands } from "@/lib/judging";
import { cn } from "@/lib/utils";
import {
	type Criterion,
	getBandDescription,
	getCriterionDescription,
	getScoreOptions
} from "../judgePortal";

export function CriterionScore({
	criterion,
	score,
	onChange,
	disabled
}: {
	criterion: Criterion;
	score?: number;
	onChange: (value: number | undefined) => void;
	disabled: boolean;
}) {
	const bands = getRubricBands(criterion.maxScore, criterion.isSidepot);
	const selectedBand = bands.find(
		(band) => score !== undefined && score >= band.min && score <= band.max
	);
	return (
		<section
			aria-labelledby={`criterion-${criterion.id}`}
			className="flex flex-col gap-6"
		>
			<div className="flex flex-col gap-3">
				<div className="flex flex-wrap items-center gap-3">
					<h2
						className="m-0 break-words font-semibold text-xl"
						id={`criterion-${criterion.id}`}
					>
						{criterion.name}
					</h2>
					{criterion.isSidepot ? (
						<Badge variant="secondary">Side pot</Badge>
					) : null}
				</div>
				<p className="m-0 max-w-prose whitespace-pre-line break-words text-muted-foreground text-sm leading-relaxed">
					{getCriterionDescription(criterion)}
				</p>
				{!criterion.description.trim() ? (
					<p className="m-0 text-muted-foreground text-xs">
						No criterion-specific description has been provided. General
						guidance is shown.
					</p>
				) : null}
			</div>
			<FieldGroup>
				<Field>
					<FieldLabel id={`score-label-${criterion.id}`}>
						Your score{" "}
						<span className="text-muted-foreground">
							/ {criterion.maxScore}
						</span>
					</FieldLabel>
					<ToggleGroup
						aria-labelledby={`score-label-${criterion.id}`}
						className="max-w-full flex-wrap gap-2"
						disabled={disabled}
						onValueChange={(values) => {
							onChange(
								typeof values[0] === "string" ? Number(values[0]) : undefined
							);
						}}
						value={score === undefined ? [] : [String(score)]}
						variant="outline"
					>
						{getScoreOptions(criterion, criterion.isSidepot, score).map(
							(value) => (
								<ToggleGroupItem
									aria-label={`${value} ${value === 1 ? "point" : "points"}`}
									className="min-h-11 min-w-11 bg-background aria-pressed:border-primary aria-pressed:bg-primary aria-pressed:text-primary-foreground aria-pressed:hover:bg-primary/90"
									key={value}
									value={String(value)}
								>
									{value}
								</ToggleGroupItem>
							)
						)}
					</ToggleGroup>
					<FieldDescription>
						{criterion.isSidepot
							? "Choose 0 if there is no evidence for this side pot. Side pots are separate from the main score."
							: "Select the score that best matches the project's evidence. Select it again to clear."}
					</FieldDescription>
				</Field>
			</FieldGroup>
			<div aria-live="polite" className="rounded-lg bg-muted/50 p-4">
				<p className="m-0 font-medium text-sm">
					{selectedBand
						? `${selectedBand.label} · ${selectedBand.range} ${selectedBand.range === "1" ? "point" : "points"}`
						: score === 0
							? "0 points selected"
							: "Rubric at a glance"}
				</p>
				<p className="mt-1 mb-0 max-w-prose text-muted-foreground text-sm leading-relaxed">
					{selectedBand
						? getBandDescription(criterion, selectedBand.label)
						: "Use the score ranges below to match the team's work to the rubric. Your selection will appear here."}
				</p>
			</div>
			<details className="rounded-lg border border-border">
				<summary className="cursor-pointer rounded-lg px-4 py-3 font-medium text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring">
					View all score ranges
				</summary>
				<dl className="m-0 border-border border-t px-4">
					{bands.map((band) => (
						<div
							className={cn(
								"grid grid-cols-[6rem_minmax(0,1fr)] gap-4 not-last:border-border not-last:border-b py-3 sm:grid-cols-[9rem_minmax(0,1fr)]",
								selectedBand === band && "bg-muted/50"
							)}
							key={band.label}
						>
							<dt className="flex flex-col gap-1">
								<span className="font-medium text-sm tabular-nums">
									{band.range} pts
								</span>
								<span className="text-muted-foreground text-xs">
									{band.label}
								</span>
							</dt>
							<dd className="m-0 break-words text-muted-foreground text-sm leading-relaxed">
								{getBandDescription(criterion, band.label)}
							</dd>
						</div>
					))}
				</dl>
			</details>
		</section>
	);
}
