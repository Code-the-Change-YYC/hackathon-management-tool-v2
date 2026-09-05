"use client";

import { useMemo } from "react";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger
} from "@/app/components/ui/accordion";
import { api } from "@/trpc/react";
import { ErrorCard, LoadingCard, PageHeader } from "./judgeSharedUi";
import { getRubricBands } from "./useJudgePortalData";

export function JudgeRubricPage() {
	const criteriaQuery = api.criteria.getAll.useQuery();
	const criteria = useMemo(
		() =>
			(criteriaQuery.data ?? [])
				.slice()
				.sort((a, b) => Number(a.isSidepot) - Number(b.isSidepot)),
		[criteriaQuery.data]
	);

	if (criteriaQuery.error) {
		return (
			<ErrorCard
				message={`Rubric could not be loaded: ${criteriaQuery.error.message}`}
			/>
		);
	}

	return (
		<div className="flex flex-col gap-6">
			<PageHeader
				description="Guidelines and criteria for assessing projects."
				title="Judging Rubric"
			/>

			<section className="rounded-2xl border border-border bg-background p-4 shadow-[0_1px_3px_rgba(0,0,0,0.06)] sm:p-8">
				<p className="mt-0 mb-4 text-muted-foreground">
					Click on any category to view the detailed scoring criteria.
				</p>
				{criteriaQuery.isLoading ? (
					<LoadingCard label="Loading rubric…" />
				) : criteria.length > 0 ? (
					<Accordion
						className="gap-4"
						defaultValue={criteria[0] ? [criteria[0].id] : []}
					>
						{criteria.map((criterion) => (
							<AccordionItem
								className="overflow-hidden rounded-2xl border border-border not-last:border-b bg-card shadow-[0_1px_3px_rgba(0,0,0,0.06)]"
								key={criterion.id}
								value={criterion.id}
							>
								<AccordionTrigger className="w-full items-center gap-4 px-4 py-4 hover:no-underline [&_svg]:size-5">
									<div className="text-left">
										<h3 className="m-0 font-medium text-base">
											{criterion.name}
										</h3>
										<p className="mt-1 mb-0 text-muted-foreground text-sm">
											{criterion.isSidepot ? "Sidepot" : "Main criteria"} ·{" "}
											{criterion.maxScore} points
										</p>
									</div>
								</AccordionTrigger>
								<AccordionContent className="border-border border-t px-4 pb-4">
									<div className="grid gap-3 pt-4 md:grid-cols-5">
										{getRubricBands(criterion.maxScore).map((band) => (
											<div
												className="rounded-xl bg-accent p-3 text-sm"
												key={`${criterion.id}-${band.label}`}
											>
												<p className="m-0 font-medium text-primary">
													{band.label}
												</p>
												<p className="mt-1 mb-0 font-semibold text-foreground">
													{band.range} pts
												</p>
												<p className="mt-2 mb-0 text-muted-foreground text-xs leading-4">
													Use this band when the project demonstrates{" "}
													{band.label.toLowerCase()} evidence for{" "}
													{criterion.name.toLowerCase()}.
												</p>
											</div>
										))}
									</div>
								</AccordionContent>
							</AccordionItem>
						))}
					</Accordion>
				) : (
					<div className="rounded-2xl border border-[#d6d6d6] border-dashed p-8 text-center text-[#575757]">
						No judging criteria have been published yet.
					</div>
				)}
			</section>
		</div>
	);
}
