import PageHeader from "@/app/components/PageHeader";
import { ScheduleItemsSkeleton } from "@/app/components/Schedule";
import { Card, CardContent, CardHeader } from "@/app/components/ui/card";
import { Skeleton } from "@/app/components/ui/skeleton";

export function ScheduleSkeleton() {
	return (
		<section
			aria-busy="true"
			aria-label="Loading schedule"
			className="flex flex-col gap-6"
		>
			<PageHeader
				description="View all hackathon events and activities"
				title="Schedule"
			/>
			<Card>
				<CardHeader className="flex flex-wrap items-center justify-between gap-3">
					<h2 className="font-medium text-[22px] leading-7">Full Schedule</h2>
					<Skeleton className="h-9 w-28 rounded-md" />
				</CardHeader>
				<CardContent>
					<ScheduleItemsSkeleton groups={2} />
				</CardContent>
			</Card>
		</section>
	);
}
