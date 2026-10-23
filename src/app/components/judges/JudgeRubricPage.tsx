"use client";

import PageHeader from "@/app/components/PageHeader";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent } from "@/app/components/ui/card";
import { Spinner } from "@/app/components/ui/spinner";
import { formatDateTime } from "@/lib/datetime";
import { api } from "@/trpc/react";
import { JudgeRubric } from "./JudgeRubric";
import { LoadingCard } from "./LoadingCard";

export function JudgeRubricPage() {
	const {
		data: criteria,
		dataUpdatedAt,
		error,
		isFetching,
		isLoading,
		refetch
	} = api.criteria.getAll.useQuery();
	const hasData = criteria !== undefined;

	return (
		<div className="mx-auto flex w-full min-w-0 max-w-6xl flex-col gap-5">
			<div className="flex flex-wrap items-start justify-between gap-4">
				<PageHeader
					description="Review the criteria and score ranges used for all rounds."
					title="Judging Rubric"
				/>
				<div className="flex flex-col items-start gap-2 sm:items-end">
					<Button
						aria-label={isFetching ? "Refreshing rubric" : "Refresh rubric"}
						disabled={isFetching}
						onClick={() => void refetch({ throwOnError: false })}
						size="sm"
						variant="outline"
					>
						{isFetching ? <Spinner data-icon="inline-start" /> : null}
						{isFetching ? "Refreshing…" : "Refresh"}
					</Button>
					{hasData && dataUpdatedAt ? (
						<p className="m-0 text-muted-foreground text-xs">
							Updated {formatDateTime(dataUpdatedAt)} · Calgary time
						</p>
					) : null}
				</div>
			</div>
			{error ? (
				<Card role="alert">
					<CardContent className="flex flex-col gap-2">
						<p className="m-0 font-medium">
							{hasData
								? "Rubric could not be refreshed"
								: "Rubric could not be loaded"}
						</p>
						<p className="m-0 text-muted-foreground text-sm">
							{hasData
								? "The guidance below may be outdated. Refresh again to check for changes."
								: "Check your connection and use Refresh to try again."}
						</p>
					</CardContent>
				</Card>
			) : null}
			{hasData ? (
				<JudgeRubric criteria={criteria} />
			) : isLoading ? (
				<LoadingCard label="Loading rubric…" />
			) : null}
		</div>
	);
}
