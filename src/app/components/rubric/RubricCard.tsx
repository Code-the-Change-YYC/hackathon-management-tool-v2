"use client";

import { useId } from "react";
import {
	type Criterion,
	sortCriteria
} from "@/app/components/judge/judgePortal";
import { Accordion } from "@/app/components/ui/accordion";
import { Card, CardContent, CardHeader } from "@/app/components/ui/card";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyTitle
} from "@/app/components/ui/empty";
import { Skeleton } from "@/app/components/ui/skeleton";
import { cn, range } from "@/lib/utils";
import { RubricCriterion } from "./RubricCriterion";

const groupCopy = {
	main: {
		title: "Main judging",
		description: "These add up to the main score."
	},
	sidepot: {
		title: "Side pots",
		description: "Scored on their own and not counted in the main score."
	}
};

function GroupHeading({ isSidepot }: { isSidepot: boolean }) {
	const { title, description } = groupCopy[isSidepot ? "sidepot" : "main"];
	return (
		<div className="flex flex-col gap-1">
			<h3 className="m-0 flex items-center gap-2 font-medium text-base">
				{title}
			</h3>
			<p className="m-0 text-muted-foreground text-sm">{description}</p>
		</div>
	);
}

function CriteriaGroup({
	criteria,
	scores,
	isSidepot = false
}: {
	criteria: Criterion[];
	scores?: Record<string, number>;
	isSidepot?: boolean;
}) {
	return (
		<section className="flex flex-col gap-3">
			<GroupHeading isSidepot={isSidepot} />
			<div className="overflow-hidden rounded-lg border border-border">
				{criteria.map((criterion, index) => (
					<RubricCriterion
						criterion={criterion}
						isSidepot={isSidepot}
						key={criterion.id}
						number={index + 1}
						score={scores?.[criterion.id]}
					/>
				))}
			</div>
		</section>
	);
}

export function RubricCard({
	title,
	description,
	criteria,
	scores,
	emptyTitle = "No judging criteria configured",
	emptyDescription = "Criteria will appear here once an organizer configures them."
}: {
	title?: string;
	description?: string;
	criteria: Criterion[];
	scores?: Record<string, number>;
	emptyTitle?: string;
	emptyDescription?: string;
}) {
	const titleId = useId();
	const ordered = criteria.slice().sort(sortCriteria);
	const main = ordered.filter((criterion) => !criterion.isSidepot);
	const sidepots = ordered.filter((criterion) => criterion.isSidepot);

	return (
		<Card aria-labelledby={titleId} className="min-w-0" role="region">
			{title && (
				<CardHeader>
					<h2 className="font-medium text-xl" id={titleId}>
						{title}
					</h2>
					{description && (
						<p className="m-0 text-muted-foreground text-sm">{description}</p>
					)}
				</CardHeader>
			)}
			<CardContent className="flex flex-col gap-6">
				{ordered.length ? (
					<Accordion
						className="gap-6"
						defaultValue={ordered.slice(0, 1).map((criterion) => criterion.id)}
						multiple
					>
						{main.length > 0 && (
							<CriteriaGroup criteria={main} scores={scores} />
						)}
						{sidepots.length > 0 && (
							<CriteriaGroup criteria={sidepots} isSidepot scores={scores} />
						)}
					</Accordion>
				) : (
					<Empty className="border border-border">
						<EmptyHeader>
							<EmptyTitle>{emptyTitle}</EmptyTitle>
							<EmptyDescription>{emptyDescription}</EmptyDescription>
						</EmptyHeader>
					</Empty>
				)}
			</CardContent>
		</Card>
	);
}

function CriterionRowSkeleton({ isSidepot = false }: { isSidepot?: boolean }) {
	return (
		<div
			className={cn(
				"flex items-center gap-3 px-4",
				isSidepot ? "h-13.5" : "h-15.5"
			)}
		>
			{!isSidepot && <Skeleton className="size-7 shrink-0 rounded-md" />}
			<Skeleton className="h-4 w-48 max-w-full" />
			<Skeleton className="ml-auto h-3 w-16 shrink-0" />
		</div>
	);
}

function ScoringScaleSkeleton() {
	return (
		<div className="@container/scale">
			<div className="grid @min-[28rem]/scale:grid-cols-5 grid-cols-1 gap-1">
				{range(5).map((index) => (
					<div
						className="flex @min-[28rem]/scale:flex-col items-center @min-[28rem]/scale:items-stretch gap-x-3 gap-y-2 p-2"
						key={index}
					>
						<Skeleton className="h-1.5 @min-[28rem]/scale:w-full w-8 shrink-0 rounded-full" />
						<div className="flex @min-[28rem]/scale:flex-col @min-[28rem]/scale:items-start items-center @min-[28rem]/scale:gap-0 gap-2">
							<Skeleton className="my-1 h-4 @min-[28rem]/scale:w-8 w-12" />
							<Skeleton className="my-0.5 h-3 w-16" />
						</div>
					</div>
				))}
			</div>
		</div>
	);
}

export function RubricCardSkeleton({ title }: { title?: string }) {
	return (
		<Card className="min-w-0">
			{title && (
				<CardHeader>
					<h2 className="font-medium text-xl">{title}</h2>
				</CardHeader>
			)}
			<CardContent className="flex flex-col gap-6">
				<div className="flex flex-col gap-3">
					<GroupHeading isSidepot={false} />
					<div className="overflow-hidden rounded-lg border border-border">
						<div className="bg-muted/30 pb-4">
							<CriterionRowSkeleton />
							<div className="flex flex-col gap-4 px-4">
								<div className="flex max-w-prose flex-col gap-2.5 py-1.5">
									<Skeleton className="h-3 w-full" />
									<Skeleton className="h-3 w-2/3" />
								</div>
								<ScoringScaleSkeleton />
							</div>
						</div>
						{range(4).map((index) => (
							<div className="border-border border-t" key={index}>
								<CriterionRowSkeleton />
							</div>
						))}
					</div>
				</div>
				<div className="flex flex-col gap-3">
					<GroupHeading isSidepot />
					<div className="overflow-hidden rounded-lg border border-border">
						{range(2).map((index) => (
							<div className="border-border not-first:border-t" key={index}>
								<CriterionRowSkeleton isSidepot />
							</div>
						))}
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
