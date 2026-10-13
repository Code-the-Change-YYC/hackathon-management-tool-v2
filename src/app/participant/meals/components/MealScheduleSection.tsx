import { Schedule } from "@/app/components/Schedule";
import type { ScheduleItemData } from "@/app/components/ScheduleItem";
import { api } from "@/trpc/server";
import { EventType } from "@/types/types";

export async function MealScheduleSection() {
	const meals = await api.meals.getActiveMeals();
	const now = new Date();

	const scheduleItems: ScheduleItemData[] = meals.map((meal) => ({
		id: meal.id,
		title: meal.title,
		startTime: meal.startTime,
		endTime: meal.endTime,
		eventType: EventType.FOOD,
		description: meal.description
	}));

	return (
		<section className="flex flex-col gap-5">
			<h2 className="font-medium text-dark-grey text-lg">Meal Schedule</h2>
			<Schedule
				emptyDescription="Check back soon for updated meal times."
				emptyTitle="No meals have been scheduled yet."
				items={scheduleItems}
				now={now}
			/>
		</section>
	);
}
