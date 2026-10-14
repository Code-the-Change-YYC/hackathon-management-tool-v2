import PageHeader from "@/app/components/PageHeader";
import { ScheduleItemsSkeleton } from "@/app/components/Schedule";
import { Card, CardContent, CardHeader } from "@/app/components/ui/card";
import { Skeleton } from "@/app/components/ui/skeleton";

export function MealsSkeleton() {
	return (
		<section
			aria-busy="true"
			aria-label="Loading meals"
			className="flex flex-col gap-6"
		>
			<PageHeader
				description="Your meal tickets, dietary restrictions, and upcoming meal times."
				title="Meals"
			/>
			<div className="flex flex-col gap-6">
				<div className="@container/meal-ticket">
					<Skeleton className="@min-[40rem]/meal-ticket:h-62.25 h-188.75 rounded-none" />
				</div>
				<Card>
					<CardHeader>
						<div className="flex flex-wrap items-center justify-between gap-1">
							<h2 className="font-medium text-xl">Dietary Restrictions</h2>
							<Skeleton className="h-9 w-18" />
						</div>
					</CardHeader>
					<CardContent>
						<div className="flex flex-wrap gap-2">
							<Skeleton className="h-8 w-24 rounded-full" />
							<Skeleton className="h-8 w-28 rounded-full" />
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardHeader>
						<h2 className="font-medium text-xl">Meal Schedule</h2>
					</CardHeader>
					<CardContent>
						<ScheduleItemsSkeleton groups={2} />
					</CardContent>
				</Card>
			</div>
		</section>
	);
}
