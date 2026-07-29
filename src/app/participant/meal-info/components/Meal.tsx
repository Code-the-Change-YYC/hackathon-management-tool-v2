import { getMealStatus, type MealScheduleMeal } from "./MealSchedule";

const timeFormatter = new Intl.DateTimeFormat("en-US", {
	hour: "numeric",
	minute: "2-digit"
});

function formatTimeRange(startTime: Date, endTime: Date) {
	return `${timeFormatter.format(startTime)} - ${timeFormatter.format(endTime)}`;
}

type MealProps = {
	meal: MealScheduleMeal;
	now: Date;
};

export function Meal({ meal, now }: MealProps) {
	const status = getMealStatus(meal, now);

	return (
		<li className="relative">
			<div className="-left-10.75 absolute top-1 flex w-7 flex-col items-center">
				<span className="rounded-full bg-dark-pink px-2 py-0.5 font-bold text-[10px] text-white">
					Food
				</span>
				<span className="mt-2 text-center text-[10px] text-dark-grey/70 leading-3">
					{status}
				</span>
			</div>

			<div className="grid gap-4 sm:grid-cols-[96px_1fr] sm:items-start">
				<div
					aria-hidden="true"
					className="h-24 w-24 rounded-md bg-pastel-pink"
				/>

				<div className="min-w-0 space-y-2">
					<h4 className="wrap-break-word font-semibold text-base text-dark-grey">
						{meal.title}
					</h4>
					<p className="text-dark-grey/70 text-xs">
						{formatTimeRange(meal.startTime, meal.endTime)}
					</p>
					<p className="text-dark-grey/70 text-sm leading-6">
						Show your meal ticket during this window to check in for{" "}
						{meal.title.toLowerCase()}.
					</p>
				</div>
			</div>
		</li>
	);
}
