import { Button } from "@/app/components/ui/button";
import {
	type Criterion,
	getCriterionDescription,
	getScoreOptions
} from "../judgePortal";

export function CriterionStep({
	criterion,
	position,
	total,
	score,
	onSelect
}: {
	criterion: Criterion;
	position: number;
	total: number;
	score?: number;
	onSelect: (value: number) => void;
}) {
	const headingId = `criterion-${criterion.id}`;

	return (
		<section aria-labelledby={headingId} className="flex flex-col gap-8">
			<div className="flex flex-col gap-3">
				<p className="m-0 text-muted-foreground text-sm">
					{`${position} of ${total}`}
					{criterion.isSidepot && " · Side pot"}
				</p>
				<h2
					className="wrap-break-word m-0 font-semibold text-3xl"
					id={headingId}
				>
					{criterion.name}
				</h2>
				<p className="wrap-break-word m-0 max-w-prose whitespace-pre-line text-lg text-muted-foreground leading-relaxed">
					{getCriterionDescription(criterion)}
				</p>
			</div>
			<div className="flex flex-col gap-2">
				<fieldset
					aria-labelledby={headingId}
					className="grid min-w-0 grid-cols-[repeat(auto-fit,minmax(2.75rem,1fr))] gap-2"
				>
					{getScoreOptions(criterion, criterion.isSidepot, score).map(
						(value) => (
							<Button
								aria-label={`${value} ${value === 1 ? "point" : "points"}`}
								aria-pressed={value === score}
								className="h-14 text-lg tabular-nums sm:h-16"
								key={value}
								onClick={() => onSelect(value)}
								variant={value === score ? "default" : "outline"}
							>
								{value}
							</Button>
						)
					)}
				</fieldset>
				<div className="flex justify-between text-muted-foreground text-sm">
					<span>{criterion.isSidepot ? "No evidence" : "Minimal"}</span>
					<span>Excellent</span>
				</div>
			</div>
		</section>
	);
}
