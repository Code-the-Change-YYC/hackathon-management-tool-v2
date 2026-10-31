import { RightLine } from "@mingcute/react";
import { Card } from "@/app/components/ui/card";
import type { Criterion } from "../judgePortal";

export function ScoreReview({
	criteria,
	scores,
	onEdit,
	disabled
}: {
	criteria: Criterion[];
	scores: Record<string, number>;
	onEdit: (step: number) => void;
	disabled: boolean;
}) {
	return (
		<section
			aria-labelledby="score-review-heading"
			className="flex flex-col gap-8"
		>
			<div className="flex flex-col gap-3">
				<h2 className="m-0 font-semibold text-3xl" id="score-review-heading">
					Review your scores
				</h2>
				<p className="m-0 text-lg text-muted-foreground">
					Select a criterion to change its score.
				</p>
			</div>
			<Card className="py-0">
				<ul className="m-0 list-none divide-y divide-grey-200 p-0">
					{criteria.map((criterion, index) => (
						<li key={criterion.id}>
							<button
								className="focus-visible:-outline-offset-2 flex min-h-16 w-full cursor-pointer items-center gap-3 px-4 py-3 text-left transition hover:bg-muted/30 focus-visible:outline-2 focus-visible:outline-primary disabled:pointer-events-none sm:px-6"
								disabled={disabled}
								onClick={() => onEdit(index)}
								type="button"
							>
								<span className="flex min-w-0 flex-1 flex-col">
									<span className="wrap-break-word font-medium">
										{criterion.name}
									</span>
									{criterion.isSidepot && (
										<span className="text-muted-foreground text-sm">
											Side pot
										</span>
									)}
								</span>
								<span className="shrink-0 tabular-nums">
									<span className="font-semibold text-xl">
										{scores[criterion.id] ?? "–"}
									</span>
									<span className="text-muted-foreground text-xs">
										/{criterion.maxScore}
									</span>
								</span>
								<RightLine
									aria-hidden
									className="size-5 text-muted-foreground"
								/>
							</button>
						</li>
					))}
				</ul>
			</Card>
		</section>
	);
}
