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
import { range } from "@/lib/utils";
import {
	type Criterion,
	getBandDescription,
	getCriterionDescription,
	sortCriteria
} from "../judgePortal";

export function JudgeRubric({ criteria }: { criteria: Criterion[] }) {
	const ordered = criteria.slice().sort(sortCriteria);
	if (!ordered.length) {
		return (
			<Empty className="border">
				<EmptyHeader>
					<EmptyTitle>No judging criteria yet</EmptyTitle>
					<EmptyDescription>
						Check back once the judging criteria have been published.
					</EmptyDescription>
				</EmptyHeader>
			</Empty>
		);
	}

	return (
		<section className="flex flex-col gap-4 rounded-2xl bg-accent p-4 sm:p-6">
			<p className="m-0 text-sm">
				Click on any category to view the detailed scoring criteria.
			</p>
			<Accordion
				className="gap-3"
				defaultValue={ordered[0] ? [ordered[0].id] : []}
			>
				{ordered.map((criterion, index) => (
					<AccordionItem
						className="rounded-xl border border-border bg-card px-4"
						key={criterion.id}
						value={criterion.id}
					>
						<AccordionTrigger className="items-center gap-3 py-4">
							<span aria-hidden="true" className="shrink-0">
								{String(index + 1).padStart(2, "0")}
							</span>
							<span className="min-w-0 flex-1 break-words">
								{criterion.name}
							</span>
							<span className="max-w-24 shrink-0 text-right">
								{criterion.isSidepot ? "Sidepot · " : ""}
								{criterion.maxScore} points
							</span>
						</AccordionTrigger>
						<AccordionContent>
							<p className="whitespace-pre-line break-words">
								{getCriterionDescription(criterion)}
							</p>
							<dl className="overflow-hidden rounded-lg border border-border">
								{getRubricBands(criterion.maxScore, criterion.isSidepot).map(
									(band) => (
										<div
											className="grid grid-cols-[5rem_minmax(0,1fr)] border-border not-last:border-b"
											key={band.label}
										>
											<dt className="flex flex-col gap-1 border-border border-r p-3">
												<span className="font-medium">{band.range} pts</span>
												<span className="break-words text-muted-foreground text-xs">
													{band.label}
												</span>
											</dt>
											<dd className="m-0 break-words p-3 text-sm">
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

function RubricRowSkeleton() {
	return (
		<div className="flex h-13.5 items-center gap-3">
			<Skeleton className="h-4 w-5 shrink-0" />
			<Skeleton className="h-4 w-48 max-w-full" />
			<Skeleton className="ml-auto h-4 w-16 shrink-0" />
		</div>
	);
}

export function JudgeRubricSkeleton() {
	return (
		<div className="flex flex-col gap-4 rounded-2xl bg-accent p-4 sm:p-6">
			<Skeleton className="my-1 h-3 w-80 max-w-full" />
			<div className="flex flex-col gap-3">
				<div className="flex flex-col gap-4 rounded-xl border border-border bg-card px-4 pb-4">
					<RubricRowSkeleton />
					<Skeleton className="my-1 h-3 w-2/3" />
					<div className="overflow-hidden rounded-lg border border-border">
						{range(5).map((index) => (
							<div
								className="grid grid-cols-[5rem_minmax(0,1fr)] border-border not-last:border-b"
								key={index}
							>
								<div className="flex flex-col gap-1 border-border border-r p-3">
									<Skeleton className="my-1 h-4 w-12" />
									<Skeleton className="my-0.5 h-3 w-10" />
								</div>
								<div className="p-3">
									<Skeleton className="my-1 h-3 w-3/4" />
								</div>
							</div>
						))}
					</div>
				</div>
				{range(3).map((index) => (
					<div
						className="rounded-xl border border-border bg-card px-4"
						key={index}
					>
						<RubricRowSkeleton />
					</div>
				))}
			</div>
		</div>
	);
}
