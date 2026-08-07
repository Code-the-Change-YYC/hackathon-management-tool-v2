import type { ScheduleItemData } from "@/app/components/ScheduleItem";
import { ScheduleSection } from "@/app/components/ScheduleSection";
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
		description: `Show your meal ticket during this window to check in for ${meal.title.toLowerCase()}.`
	}));

	return (
		<ScheduleSection
			emptyDescription="Check back soon for meal times and ticket scanning windows."
			emptyTitle="No meals have been scheduled yet."
			items={scheduleItems}
			now={now}
			title="Meal Schedule"
		/>
	);
}
