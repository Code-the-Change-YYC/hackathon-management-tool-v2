import { Schedule } from "@/app/components/Schedule";
import { Card, CardContent, CardHeader } from "@/app/components/ui/card";
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
		<Card aria-labelledby="meal-schedule-title" role="region">
			<CardHeader>
				<h2 className="font-medium text-xl" id="meal-schedule-title">
					Meal Schedule
				</h2>
			</CardHeader>
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
	);
}
