import type { ReactNode } from "react";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger
} from "@/app/components/ui/accordion";
import { Empty, EmptyDescription } from "@/app/components/ui/empty";
import { getRubricBands } from "@/lib/judging";
import { cn } from "@/lib/utils";
import {
	type Criterion,
	getBandDescription,
	getCriterionDescription,
	getScoreFillClass,
	getScoreTextColor,
	sortCriteria
} from "./judgePortal";

function RubricScoreBar({
	value,
	max,
	className
}: {
	value: number;
	max: number;
	className?: string;
}) {
	return (
		<span
			aria-hidden="true"
			className={cn(
				"block h-1 overflow-hidden rounded-full bg-grey-300",
				className
			)}
		>
			<span
				className={cn(
					"block h-full rounded-full",
					getScoreFillClass(value, max)
				)}
				style={{
					width: `${Math.min(100, Math.max(0, (value / Math.max(1, max)) * 100))}%`
				}}
			/>
		</span>
	);
}

export function JudgeRubric({
	criteria,
	variant = "default",
	scores,
	children
}: {
	criteria: Criterion[];
	variant?: "default" | "participant";
	scores?: Record<string, number>;
	children?: ReactNode;
}) {
	const participant = variant === "participant";
	const ordered = criteria.slice().sort(sortCriteria);
	if (!ordered.length) {
		return (
			<>
				{children}
				<Empty>
					<EmptyDescription>
						No judging criteria have been published yet.
					</EmptyDescription>
				</Empty>
			</>
		);
	}

	return (
		<section
			className={cn(
				"flex flex-col gap-4 rounded-2xl bg-accent p-4 sm:p-6",
				participant && "gap-4 bg-purple-50 px-8 py-4 sm:px-8"
			)}
		>
			{
				<p
					className={cn(
						"m-0 text-sm",
						participant && "font-medium text-base/6 italic"
					)}
				>
					{scores
						? "Click on any category to view the detailed scoring criteria for each round of judging."
						: "Click on any category to view the detailed scoring criteria."}
				</p>
			}
			{children}
			<Accordion
				className="gap-3"
				defaultValue={ordered[0] ? [ordered[0].id] : []}
			>
				{ordered.map((criterion, index) => (
					<AccordionItem
						className={cn(
							"rounded-xl border border-border bg-card px-4",
							participant &&
								"rounded-[10px] border-[0.4px] border-grey-300 data-open:border-purple-500"
						)}
						key={criterion.id}
						value={criterion.id}
					>
						<AccordionTrigger
							className={cn(
								"items-center gap-3 py-4",
								participant && "gap-4 text-base/6 [&_svg]:size-5"
							)}
						>
							<span aria-hidden="true" className="shrink-0">
								{String(index + 1).padStart(2, "0")}
							</span>
							<span className="min-w-0 flex-1 break-words">
								{criterion.name}
							</span>
							{scores && (
								<RubricScoreBar
									className="hidden flex-1 sm:block"
									max={criterion.maxScore}
									value={scores[criterion.id] ?? 0}
								/>
							)}
							<span
								className={cn(
									"max-w-24 shrink-0 text-right",
									participant && "font-medium text-[11px]/4 uppercase"
								)}
							>
								{criterion.isSidepot ? "Sidepot · " : ""}
								{scores && scores[criterion.id] !== undefined
									? `${Number(scores[criterion.id]?.toFixed(1))} / `
									: participant
										? "0–"
										: ""}
								{criterion.maxScore}
								{participant ? "" : " points"}
							</span>
						</AccordionTrigger>
						{scores && (
							<RubricScoreBar
								className="mb-4 sm:hidden"
								max={criterion.maxScore}
								value={scores[criterion.id] ?? 0}
							/>
						)}
						<AccordionContent
							className={
								participant
									? "border-grey-300 border-t-[0.4px] pt-4 pb-5"
									: undefined
							}
						>
							<p
								className={cn(
									"whitespace-pre-line break-words",
									participant && "font-medium text-sm/5"
								)}
							>
								{getCriterionDescription(criterion)}
							</p>
							<dl
								className={cn(
									"overflow-hidden rounded-lg border border-border",
									participant && "rounded-none border-0 px-2 sm:px-5"
								)}
							>
								{getRubricBands(criterion.maxScore, criterion.isSidepot).map(
									(band) => (
										<div
											className={cn(
												"grid grid-cols-[5rem_minmax(0,1fr)] border-border not-last:border-b",
												participant &&
													"grid-cols-[80px_minmax(0,1fr)] border-grey-100 sm:grid-cols-[108px_minmax(0,1fr)] sm:border-grey-300",
												scores &&
													scores[criterion.id] !== undefined &&
													(scores[criterion.id] ?? 0) > band.min - 1 &&
													(scores[criterion.id] ?? 0) <= band.max &&
													"bg-purple-50"
											)}
											key={band.label}
										>
											<dt
												className={cn(
													"flex flex-col gap-1 border-border border-r p-3",
													participant &&
														"gap-0.5 border-grey-100 border-r bg-grey-50 px-2 py-3 text-center sm:gap-2 sm:border-0 sm:bg-transparent sm:py-6 sm:pl-0 sm:text-left"
												)}
											>
												<span
													className={cn(
														"font-medium",
														participant &&
															"font-medium text-base/6 sm:font-normal sm:text-2xl/8",
														participant &&
															getScoreTextColor(
																Math.max(0, band.min - 1),
																criterion.maxScore
															)
													)}
												>
													{band.range}
													{participant ? "" : " pts"}
												</span>
												<span
													className={cn(
														"break-words text-muted-foreground text-xs",
														participant &&
															"font-medium text-[9px]/3.5 text-grey-800 uppercase sm:text-xs/4"
													)}
												>
													{band.label}
												</span>
											</dt>
											<dd
												className={cn(
													"m-0 break-words p-3 text-sm",
													participant &&
														"px-2 py-3 text-xs/4 sm:px-3 sm:py-6 sm:text-sm/5"
												)}
											>
												{getBandDescription(criterion, band.label)}
											</dd>
										</div>
									)
								)}
							</dl>
						</AccordionContent>
					</AccordionItem>
				))}
			</Accordion>
		</section>
	);
}
