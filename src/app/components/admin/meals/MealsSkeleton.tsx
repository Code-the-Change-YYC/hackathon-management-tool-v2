import { BannerSkeleton } from "@/app/components/Banner";
import PageHeader from "@/app/components/PageHeader";
import { ScheduleItemsSkeleton } from "@/app/components/Schedule";
import { Card, CardContent, CardHeader } from "@/app/components/ui/card";
import { MealAnalyticsSkeleton } from "./MealAnalytics";

export function MealsSkeleton() {
	return (
		<section
			aria-busy="true"
			aria-label="Loading meals"
			className="flex flex-col gap-6"
		>
			<PageHeader
				description="Scan meal tickets, check meal times, and plan for dietary restrictions."
				title="Meals"
			/>
			<BannerSkeleton />
			<Card>
				<CardHeader>
					<h2 className="font-medium text-xl">Meal Schedule</h2>
				</CardHeader>
				<CardContent>
					<ScheduleItemsSkeleton groups={2} />
				</CardContent>
			</Card>
			<MealAnalyticsSkeleton />
		</section>
	);
}
