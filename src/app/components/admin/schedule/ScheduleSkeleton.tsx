import PageHeader from "@/app/components/PageHeader";
import { ScheduleItemsSkeleton } from "@/app/components/Schedule";
import { Card, CardContent, CardHeader } from "@/app/components/ui/card";
import { Skeleton } from "@/app/components/ui/skeleton";
import { range } from "@/lib/utils";

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
				<CardHeader>
					<h2 className="font-medium text-xl">Event Schedule</h2>
				</CardHeader>
				<CardContent>
					<ScheduleItemsSkeleton groups={2} />
				</CardContent>
			</Card>
			<div className="flex flex-col gap-4">
				<h2 className="font-medium text-xl">Locations and Directions</h2>
				<div className="flex flex-col gap-3">
					{range(3).map((index) => (
						<div className="rounded-lg border p-4" key={index}>
							<Skeleton className="my-1 h-4 w-72 max-w-full" />
						</div>
					))}
				</div>
			</div>
		</section>
	);
}
