import { BannerSkeleton } from "@/app/components/Banner";
import PageHeader from "@/app/components/PageHeader";
import { ScheduleItemsSkeleton } from "@/app/components/Schedule";
import { Card, CardContent } from "@/app/components/ui/card";

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
			<BannerSkeleton />
			<Card>
				<CardContent>
					<ScheduleItemsSkeleton groups={2} />
				</CardContent>
			</Card>
		</section>
	);
}
