import PageHeader from "@/app/components/PageHeader";
import { Card, CardContent, CardHeader } from "@/app/components/ui/card";
import { Skeleton } from "@/app/components/ui/skeleton";
import { range } from "@/lib/utils";
import {
	JudgeScheduleEventSkeleton,
	ScheduleTable
} from "./JudgeScheduleEvent";

function RoundScheduleSkeleton() {
	return (
		<Card className="min-w-0">
			<CardHeader className="flex flex-wrap items-center gap-x-3 gap-y-1">
				<Skeleton className="my-1 h-5 w-32" />
				<Skeleton className="my-0.5 h-4 w-14" />
			</CardHeader>
			<CardContent className="flex flex-col gap-6">
				<div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-muted/50 px-4 py-3">
					<div className="flex flex-col gap-1">
						<Skeleton className="my-0.5 h-4 w-56 max-w-full" />
						<Skeleton className="my-0.5 h-4 w-40" />
					</div>
					<div className="flex flex-wrap items-center gap-3">
						<Skeleton className="my-0.5 h-4 w-36" />
						<Skeleton className="h-9 w-32" />
					</div>
				</div>
				<ScheduleTable>
					{range(3).map((index) => (
						<JudgeScheduleEventSkeleton key={index} />
					))}
				</ScheduleTable>
			</CardContent>
		</Card>
	);
}

export function ScheduleSkeleton() {
	return (
		<section
			aria-busy="true"
			aria-label="Loading schedule"
			className="mx-auto flex w-full min-w-0 max-w-6xl flex-col gap-6"
		>
			<div className="flex flex-wrap items-start justify-between gap-4">
				<PageHeader
					description="Your teams, presentation times, and scorecards."
					title="Judging Schedule"
				/>
				<div className="flex flex-col items-start gap-2 sm:items-end">
					<Skeleton className="h-9 w-24" />
					<Skeleton className="my-0.5 h-3 w-52" />
				</div>
			</div>
			<RoundScheduleSkeleton />
			<RoundScheduleSkeleton />
		</section>
	);
}
