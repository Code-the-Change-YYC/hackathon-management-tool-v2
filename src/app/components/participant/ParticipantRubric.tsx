import type { ReactNode } from "react";
import {
	type Criterion,
	getBandDescription,
	getCriterionDescription,
	getScoreFillClass,
	getScoreTextColor,
	sortCriteria
} from "@/app/components/judge/judgePortal";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger
} from "@/app/components/ui/accordion";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyTitle
} from "@/app/components/ui/empty";
import { Skeleton } from "@/app/components/ui/skeleton";
import { getRubricBands } from "@/lib/judging";
import { cn, range } from "@/lib/utils";

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
			aria-hidden
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

export function ParticipantRubric({
	criteria,
	scores,
	children
}: {
	criteria: Criterion[];
	scores?: Record<string, number>;
	children?: ReactNode;
}) {
	const ordered = criteria.slice().sort(sortCriteria);
	if (!ordered.length)
		return (
			<>
				{children}
				<Empty>
					<EmptyHeader>
						<EmptyTitle>No judging criteria yet</EmptyTitle>
						<EmptyDescription>
							Check back once the judging criteria have been published.
						</EmptyDescription>
					</EmptyHeader>
				</Empty>
			</>
		);
	return (
		<section className="flex flex-col gap-4">
			<p className="m-0 font-medium text-base/6 italic">
				{scores
					? "Click on any category to view the detailed scoring criteria for each round of judging."
					: "Click on any category to view the detailed scoring criteria."}
			</p>
			{children}
			<Accordion
				className="gap-3"
				defaultValue={ordered[0] ? [ordered[0].id] : []}
			>
				{ordered.map((criterion, index) => {
					const value = scores?.[criterion.id];
					return (
						<AccordionItem
							className="rounded-[10px] border-[0.4px] border-grey-300 bg-card px-4 data-open:border-purple-500"
							key={criterion.id}
							value={criterion.id}
						>
							<AccordionTrigger className="items-center gap-4 py-4 text-base/6 [&_svg]:size-5">
								<span aria-hidden className="shrink-0">
									{String(index + 1).padStart(2, "0")}
								</span>
								<span className="min-w-0 flex-1 break-words">
									{criterion.name}
								</span>
								{scores && (
									<RubricScoreBar
										className="hidden flex-1 sm:block"
										max={criterion.maxScore}
										value={value ?? 0}
									/>
								)}
								<span className="max-w-24 shrink-0 text-right font-medium text-[11px]/4 uppercase">
									{criterion.isSidepot ? "Sidepot · " : ""}
									{value !== undefined
										? `${Number(value.toFixed(2))} / `
										: criterion.isSidepot
											? "0–"
											: "1–"}
									{criterion.maxScore}
								</span>
							</AccordionTrigger>
							{scores && (
								<RubricScoreBar
									className="mb-4 sm:hidden"
									max={criterion.maxScore}
									value={value ?? 0}
								/>
							)}
							<AccordionContent className="border-grey-300 border-t-[0.4px] pt-4 pb-5">
								<p className="whitespace-pre-line break-words font-medium text-sm/5">
									{getCriterionDescription(criterion)}
								</p>
								<dl className="overflow-hidden px-2 sm:px-5">
									{getRubricBands(criterion.maxScore, criterion.isSidepot).map(
										(band) => (
											<div
												className={cn(
													"grid grid-cols-[80px_minmax(0,1fr)] border-grey-100 not-last:border-b sm:grid-cols-[108px_minmax(0,1fr)] sm:border-grey-300",
													value !== undefined &&
														value > band.min - 1 &&
														value <= band.max &&
														"bg-purple-50"
												)}
												key={band.label}
											>
												<dt className="flex flex-col gap-0.5 border-grey-100 border-r bg-grey-50 px-2 py-3 text-center sm:gap-2 sm:border-0 sm:bg-transparent sm:py-6 sm:pl-0 sm:text-left">
													<span
														className={cn(
															"font-medium text-base/6 sm:font-normal sm:text-2xl/8",
															getScoreTextColor(
																Math.max(0, band.min - 1),
																criterion.maxScore
															)
														)}
													>
														{band.range}
													</span>
													<span className="break-words font-medium text-[9px]/3.5 text-grey-800 uppercase sm:text-xs/4">
														{band.label}
													</span>
												</dt>
												<dd className="m-0 break-words px-2 py-3 text-xs/4 sm:px-3 sm:py-6 sm:text-sm/5">
													{getBandDescription(criterion, band.label)}
												</dd>
											</div>
										)
									)}
								</dl>
							</AccordionContent>
						</AccordionItem>
					);
				})}
			</Accordion>
		</section>
	);
}

function RubricRowSkeleton() {
	return (
		<div className="flex h-14.5 items-center gap-4">
			<Skeleton className="h-4 w-5 shrink-0" />
			<Skeleton className="h-4 w-48 max-w-full" />
			<Skeleton className="ml-auto h-3 w-8 shrink-0" />
		</div>
	);
}

export function ParticipantRubricSkeleton() {
	return (
		<div className="flex flex-col gap-4">
			<Skeleton className="my-1 h-4 w-96 max-w-full" />
			<div className="flex gap-2">
				<Skeleton className="h-7 w-36" />
				<Skeleton className="h-7 w-18" />
			</div>
			<div className="flex flex-col gap-3">
				<div className="rounded-[10px] border-[0.4px] border-purple-500 bg-card px-4">
					<RubricRowSkeleton />
					<div className="border-grey-300 border-t-[0.4px] pt-4 pb-5">
						<Skeleton className="my-1 h-3 w-2/3" />
						<Skeleton className="my-1 h-3 w-1/2" />
						<div className="px-2 sm:px-5">
							{range(5).map((index) => (
								<div
									className="grid grid-cols-[80px_minmax(0,1fr)] gap-3 border-grey-100 not-last:border-b py-3 sm:grid-cols-[108px_minmax(0,1fr)] sm:border-grey-300 sm:py-6"
									key={index}
								>
									<div className="flex flex-col items-center gap-1 sm:items-start sm:gap-2">
										<Skeleton className="my-1 h-4 w-10 sm:h-6" />
										<Skeleton className="my-0.5 h-3 w-14" />
									</div>
									<div className="flex flex-col gap-2">
										<Skeleton className="h-3 w-full" />
										<Skeleton className="h-3 w-2/3" />
									</div>
								</div>
							))}
						</div>
					</div>
				</div>
				{range(3).map((index) => (
					<div
						className="rounded-[10px] border-[0.4px] border-grey-300 bg-card px-4"
						key={index}
					>
						<RubricRowSkeleton />
					</div>
				))}
			</div>
		</div>
	);
}
