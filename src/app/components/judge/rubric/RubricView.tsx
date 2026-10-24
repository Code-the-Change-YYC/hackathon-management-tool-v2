"use client";

import PageHeader from "@/app/components/PageHeader";
import { Button } from "@/app/components/ui/button";
import { Spinner } from "@/app/components/ui/spinner";
import { useRefresh } from "@/hooks/use-refresh";
import type { Criterion } from "../judgePortal";
import { JudgeRubric } from "./JudgeRubric";

export function RubricView({ criteria }: { criteria: Criterion[] }) {
	const { isRefreshing, refresh } = useRefresh();
	return (
		<div className="mx-auto flex w-full min-w-0 max-w-6xl flex-col gap-5">
			<div className="flex flex-wrap items-start justify-between gap-4">
				<PageHeader
					description="Review the criteria and score ranges used for all rounds."
					title="Judging Rubric"
				/>
				<Button
					aria-label={isRefreshing ? "Refreshing rubric" : "Refresh rubric"}
					disabled={isRefreshing}
					onClick={() => refresh()}
					size="sm"
					variant="outline"
				>
					{isRefreshing ? <Spinner data-icon="inline-start" /> : null}
					{isRefreshing ? "Refreshing…" : "Refresh"}
				</Button>
			</div>
			<JudgeRubric criteria={criteria} />
		</div>
	);
}
