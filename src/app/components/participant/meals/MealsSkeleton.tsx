import PageHeader from "@/app/components/PageHeader";
import { ScheduleItemsSkeleton } from "@/app/components/Schedule";
import { Card, CardAction, CardContent } from "@/app/components/ui/card";
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
			<div className="flex flex-col gap-12">
				<div className="@container/meal-ticket flex flex-col gap-4">
					<h2 className="font-medium text-dark-grey text-xl">
						Your Meal Ticket
					</h2>
					<Skeleton className="@min-[40rem]/meal-ticket:h-62.25 h-188.75 rounded-none" />
				</div>
				<div className="flex flex-col gap-4">
					<h2 className="font-medium text-dark-grey text-xl">
						Dietary Restrictions
					</h2>
					<Card>
						<CardContent className="flex items-center justify-between">
							<div className="flex flex-wrap gap-2">
								<Skeleton className="h-8 w-24 rounded-full" />
								<Skeleton className="h-8 w-28 rounded-full" />
							</div>
							<CardAction>
								<Skeleton className="h-9 w-18" />
							</CardAction>
						</CardContent>
					</Card>
				</div>
				<div className="flex flex-col gap-4">
					<h2 className="font-medium text-dark-grey text-xl">Meal Schedule</h2>
					<Card>
						<CardContent>
							<ScheduleItemsSkeleton groups={2} />
						</CardContent>
					</Card>
				</div>
			</div>
		</section>
	);
}
