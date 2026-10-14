import { BannerSkeleton } from "@/app/components/Banner";
import { ScheduleItemsSkeleton } from "@/app/components/Schedule";
import { Card, CardContent, CardHeader } from "@/app/components/ui/card";
import { Skeleton } from "@/app/components/ui/skeleton";
import {
	JudgingStatusSkeleton,
	SubmissionCountdownSkeleton
} from "../ParticipantStatus";

export function DashboardSkeleton() {
	return (
		<section
			aria-busy="true"
			aria-label="Loading dashboard"
			className="flex flex-col gap-6"
		>
			<div className="flex flex-col gap-1">
				<Skeleton className="my-1 h-6 w-64 md:h-7" />
				<Skeleton className="my-1 h-3 w-80 max-w-full" />
			</div>
			<BannerSkeleton />
			<div className="grid min-w-0 items-start gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
				<Card>
					<CardHeader>
						<div className="flex flex-wrap items-center justify-between gap-1">
							<h2 className="font-medium text-xl">Upcoming Events</h2>
							<Skeleton className="h-9 w-40" />
						</div>
					</CardHeader>
					<CardContent>
						<ScheduleItemsSkeleton showGroupLabels={false} />
					</CardContent>
				</Card>
				<Card>
					<CardContent className="@container">
						<div className="grid gap-12 max-lg:@[34rem]:grid-cols-2 lg:min-h-89 lg:content-between lg:gap-10">
							<SubmissionCountdownSkeleton />
							<JudgingStatusSkeleton />
						</div>
					</CardContent>
				</Card>
			</div>
		</section>
	);
}
