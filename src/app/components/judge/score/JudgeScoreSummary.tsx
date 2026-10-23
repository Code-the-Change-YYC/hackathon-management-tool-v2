import { Button } from "@/app/components/ui/button";
import type { Criterion } from "../judgePortal";

export function ScoreReview({
	criteria,
	scores,
	onEdit,
	disabled
}: {
	criteria: Criterion[];
	scores: Record<string, number>;
	onEdit: (index: number) => void;
	disabled: boolean;
}) {
	return (
		<section
			aria-labelledby="score-review-heading"
			className="flex flex-col gap-5"
		>
			<div>
				<h2 className="m-0 font-semibold text-xl" id="score-review-heading">
					Review your scores
				</h2>
				<p className="mt-2 mb-0 text-muted-foreground text-sm">
					Check each assessment before submitting. These are your individual
					scores.
				</p>
			</div>
			{[false, true].map((isSidepot) => {
				const group = criteria.filter(
					(criterion) => criterion.isSidepot === isSidepot
				);
				return group.length ? (
					<div className="flex flex-col gap-2" key={String(isSidepot)}>
						<h3 className="m-0 font-medium text-sm">
							{isSidepot ? "Side pots · scored separately" : "Main criteria"}
						</h3>
						<div className="divide-y divide-border rounded-lg border border-border">
							{group.map((criterion) => (
								<div
									className="flex items-center gap-3 px-4 py-3"
									key={criterion.id}
								>
									<div className="min-w-0 flex-1">
										<p className="m-0 break-words font-medium text-sm">
											{criterion.name}
										</p>
										<p className="mt-1 mb-0 text-muted-foreground text-xs">
											{Object.hasOwn(scores, criterion.id)
												? `${scores[criterion.id]} / ${criterion.maxScore} points`
												: "Not scored yet"}
										</p>
									</div>
									<Button
										aria-label={`Edit ${criterion.name}`}
										disabled={disabled}
										onClick={() =>
											onEdit(
												criteria.findIndex((item) => item.id === criterion.id)
											)
										}
										size="sm"
										variant="ghost"
									>
										Edit
									</Button>
								</div>
							))}
						</div>
					</div>
				) : null;
			})}
		</section>
	);
}
