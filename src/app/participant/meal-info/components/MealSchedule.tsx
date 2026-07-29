import { Meal } from "./Meal";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
	weekday: "long",
	month: "long",
	day: "numeric"
});

export type MealScheduleMeal = {
	id: string;
	title: string;
	startTime: Date;
	endTime: Date;
};

function formatDateKey(date: Date) {
	return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

export function getMealStatus(meal: MealScheduleMeal, now: Date) {
	const startTime = meal.startTime.getTime();
	const endTime = meal.endTime.getTime();
	const currentTime = now.getTime();

	if (currentTime >= startTime && currentTime <= endTime) {
		return "Ongoing";
	}

	if (currentTime > endTime) {
		return "Ended";
	}

	const minutesUntilStart = Math.max(
		1,
		Math.round((startTime - currentTime) / 60000)
	);

	if (minutesUntilStart <= 60) {
		return `In ${minutesUntilStart} min`;
	}

	return "Scheduled";
}

export type MealGroup = {
	key: string;
	label: string;
	meals: MealScheduleMeal[];
};

export function groupMealsByDate(meals: MealScheduleMeal[]) {
	return meals.reduce<MealGroup[]>((groups, meal) => {
		const key = formatDateKey(meal.startTime);
		const existingGroup = groups.find((group) => group.key === key);

		if (existingGroup) {
			existingGroup.meals.push(meal);
			return groups;
		}

		groups.push({
			key,
			label: dateFormatter.format(meal.startTime),
			meals: [meal]
		});

		return groups;
	}, []);
}

type MealScheduleProps = {
	meals: MealScheduleMeal[];
	now: Date;
};

export function MealSchedule({ meals, now }: MealScheduleProps) {
	const groupedMeals = groupMealsByDate(meals);

	return (
		<section className="space-y-5">
			<h2 className="font-semibold text-dark-grey text-lg">Meal Schedule</h2>

			{groupedMeals.length > 0 ? (
				<div className="grid gap-8 lg:grid-cols-2">
					{groupedMeals.map((group) => (
						<div className="space-y-4" key={group.key}>
							<h3 className="font-bold text-dark-grey text-sm">
								{group.label}
							</h3>
							<ol className="relative space-y-8 border-medium-grey border-l pl-8">
								{group.meals.map((meal) => (
									<Meal key={meal.id} meal={meal} now={now} />
								))}
							</ol>
						</div>
					))}
				</div>
			) : (
				<div className="rounded-lg border border-medium-grey border-dashed bg-white px-6 py-10 text-center">
					<p className="font-semibold text-dark-grey">
						No meals have been scheduled yet.
					</p>
					<p className="mt-2 text-dark-grey/60 text-sm">
						Check back soon for meal times and ticket scanning windows.
					</p>
				</div>
			)}
		</section>
	);
}
