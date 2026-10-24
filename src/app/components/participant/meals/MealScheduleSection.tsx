import { Schedule } from "@/app/components/Schedule";
import { Card, CardContent, CardHeader } from "@/app/components/ui/card";
import type { RouterOutputs } from "@/trpc/react";

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
					items={meals}
					now={now}
				/>
			</CardContent>
		</Card>
	);
}
