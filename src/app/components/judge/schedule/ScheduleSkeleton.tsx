import PageHeader from "@/app/components/PageHeader";
import { Card, CardContent } from "@/app/components/ui/card";
import { Skeleton } from "@/app/components/ui/skeleton";
import { range } from "@/lib/utils";
import { JudgeScheduleEventSkeleton } from "./JudgeScheduleEvent";

export function ScheduleSkeleton() {
	return (
		<section
			aria-busy="true"
			aria-label="Loading schedule"
			className="flex flex-col gap-6"
		>
			<PageHeader
				description="View your assigned time slots."
				title="Judging Schedule"
			/>
			<Card>
				<CardContent className="flex items-center justify-between">
					<div>
						<p className="m-0 text-muted-foreground text-xs">Current time</p>
						<Skeleton className="my-1 h-5 w-20" />
					</div>
					<div className="flex flex-col items-end">
						<p className="m-0 text-muted-foreground text-xs">Room assignment</p>
						<Skeleton className="my-1 h-4 w-16" />
					</div>
				</CardContent>
			</Card>
			<div className="flex flex-col gap-3">
				<Skeleton className="my-1 h-4 w-44" />
				<div className="flex flex-col gap-4 sm:pl-6">
					{range(3).map((index) => (
						<div
							className="grid gap-2 sm:grid-cols-[64px_1fr] sm:gap-4"
							key={index}
						>
							<Skeleton className="my-0.5 h-4 w-16 sm:mt-2.5" />
							<JudgeScheduleEventSkeleton />
						</div>
					))}
				</div>
			</div>
		</section>
	);
}
