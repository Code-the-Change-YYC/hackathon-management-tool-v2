import { Schedule } from "@/app/components/Schedule";
import { Card, CardContent } from "@/app/components/ui/card";
import type { RouterOutputs } from "@/trpc/react";
import { EventType } from "@/types/types";

type Meal = RouterOutputs["meals"]["getActiveMeals"][number];

export function MealScheduleSection({
	meals,
	now
}: {
	meals: Meal[];
	now: Date;
}) {
	return (
		<section className="flex flex-col gap-4">
			<h2 className="font-medium text-dark-grey text-xl">Meal Schedule</h2>
			<Card>
				<CardContent>
					<Schedule
						emptyDescription="Check back soon for updated meal times."
						emptyTitle="No meals have been scheduled yet"
						items={meals.map((meal) => ({
							id: meal.id,
							title: meal.title,
							startTime: meal.startTime,
							endTime: meal.endTime,
							eventType: EventType.FOOD,
							description: meal.description
						}))}
						now={now}
					/>
				</CardContent>
			</Card>
		</section>
	);
}
