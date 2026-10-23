"use client";

import { useState } from "react";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger
} from "@/app/components/ui/accordion";
import { Button } from "@/app/components/ui/button";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyTitle
} from "@/app/components/ui/empty";
import { getRubricBands } from "@/lib/judging";
import {
	type Criterion,
	getBandDescription,
	getCriterionDescription,
	sortCriteria
} from "./judgePortal";

export function JudgeRubric({
	criteria,
	emptyDescription = "Criteria will appear here once an organizer configures them."
}: {
	criteria: Criterion[];
	emptyDescription?: string;
}) {
	const ordered = criteria.slice().sort(sortCriteria);
	const [expanded, setExpanded] = useState<string[] | null>(null);
	const criterionIds = new Set(ordered.map((criterion) => criterion.id));
	// Null keeps the initial expansion derived from the first available criterion.
	// An explicit empty array preserves the judge's choice to collapse everything.
	const openIds =
		expanded === null
			? ordered.slice(0, 1).map((criterion) => criterion.id)
			: expanded.filter((id) => criterionIds.has(id));
	if (!ordered.length) {
		return (
			<Empty className="border border-border">
				<EmptyHeader>
					<EmptyTitle>No judging criteria configured</EmptyTitle>
					<EmptyDescription>{emptyDescription}</EmptyDescription>
				</EmptyHeader>
			</Empty>
		);
	}
	const main = ordered.filter((criterion) => !criterion.isSidepot);
	const sidepots = ordered.filter((criterion) => criterion.isSidepot);
	const maxMainScore = main.reduce(
		(total, criterion) => total + criterion.maxScore,
		0
	);
	const allExpanded = openIds.length === ordered.length;
	const groups = [
		{
			title: "Main judging criteria",
			description: "Main points are shown separately from side-pot scores.",
			criteria: main
		},
		{
			title: "Side pots",
			description: "Review each side pot using its own criteria.",
			criteria: sidepots
		}
	];

	return (
		<div className="flex flex-col gap-5">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<p className="m-0 text-muted-foreground text-sm">
					{main.length
						? `${main.length} main ${main.length === 1 ? "criterion" : "criteria"} · ${maxMainScore} maximum points`
						: "No main judging criteria configured"}
					{sidepots.length
						? ` · ${sidepots.length} side ${sidepots.length === 1 ? "pot" : "pots"}`
						: ""}
				</p>
				<Button
					onClick={() =>
						setExpanded(
							allExpanded ? [] : ordered.map((criterion) => criterion.id)
						)
					}
					size="sm"
					variant="outline"
				>
					{allExpanded ? "Collapse all" : "Expand all"}
				</Button>
			</div>
			<Accordion
				className="gap-6"
				multiple
				onValueChange={(values) =>
					setExpanded(
						values.filter((value): value is string => typeof value === "string")
					)
				}
				value={openIds}
			>
				{groups
					.filter((group) => group.criteria.length > 0)
					.map((group) => (
						<section className="flex flex-col gap-3" key={group.title}>
							<div>
								<h2 className="m-0 font-medium text-base">{group.title}</h2>
								<p className="mt-1 mb-0 text-muted-foreground text-sm">
									{group.description}
								</p>
							</div>
							<div className="overflow-hidden rounded-lg border border-border">
								{group.criteria.map((criterion) => (
									<AccordionItem
										className="px-4"
										key={criterion.id}
										value={criterion.id}
									>
										<AccordionTrigger className="items-center gap-3 py-4">
											<span className="min-w-0 flex-1 break-words">
												{criterion.name}
											</span>
											<span className="shrink-0 whitespace-nowrap text-muted-foreground text-xs tabular-nums">
												{criterion.maxScore} points
											</span>
										</AccordionTrigger>
										<AccordionContent className="pb-4">
											{!criterion.description.trim() ? (
												<p className="max-w-prose text-muted-foreground text-sm">
													No criterion-specific description has been provided.
													General guidance is shown below.
												</p>
											) : null}
											<p className="max-w-prose whitespace-pre-line break-words text-sm leading-relaxed">
												{getCriterionDescription(criterion)}
											</p>
											<dl
												aria-label={`${criterion.name} score ranges`}
												className="@container/rubric-bands overflow-hidden rounded-lg border border-border"
											>
												{getRubricBands(
													criterion.maxScore,
													criterion.isSidepot
												).map((band) => (
													<div
														className="grid @min-[480px]/rubric-bands:grid-cols-[9rem_minmax(0,1fr)] grid-cols-1 border-border not-last:border-b"
														key={band.label}
													>
														<dt className="flex @min-[480px]/rubric-bands:flex-col flex-wrap items-baseline gap-x-3 gap-y-1 px-3 @min-[480px]/rubric-bands:py-3 pt-3">
															<span className="whitespace-nowrap font-medium text-sm tabular-nums">
																{band.range} pts
															</span>
															<span className="whitespace-nowrap text-muted-foreground text-xs">
																{band.label}
															</span>
														</dt>
														<dd className="m-0 max-w-prose break-words px-3 @min-[480px]/rubric-bands:pt-3 pt-1 pb-3 text-sm leading-relaxed">
															{getBandDescription(criterion, band.label)}
														</dd>
													</div>
												))}
											</dl>
										</AccordionContent>
									</AccordionItem>
								))}
							</div>
						</section>
					))}
			</Accordion>
		</div>
	);
}
