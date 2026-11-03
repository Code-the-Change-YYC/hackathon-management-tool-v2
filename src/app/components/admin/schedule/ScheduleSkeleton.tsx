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
					<h2 className="font-medium text-[22px] leading-7">Hackathon Dates</h2>
					<Skeleton className="h-9 w-24 rounded-md" />
				</CardHeader>
				<CardContent className="grid gap-6 xl:grid-cols-3">
					{[0, 1, 2].map((index) => (
						<div className="flex flex-col gap-4" key={index}>
							<Skeleton className="h-5 w-36" />
							<div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_10rem] xl:grid-cols-1">
								<Skeleton className="h-16 w-full" />
								<Skeleton className="h-16 w-full" />
							</div>
						</div>
					))}
				</CardContent>
			</Card>
			<Card>
				<CardHeader className="flex flex-wrap items-center justify-between gap-3">
					<h2 className="font-medium text-[22px] leading-7">Events</h2>
					<Skeleton className="h-9 w-28 rounded-md" />
				</CardHeader>
				<CardContent>
					<ScheduleItemsSkeleton groups={2} />
				</CardContent>
			</Card>
		</section>
	);
}
