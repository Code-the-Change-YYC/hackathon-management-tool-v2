"use client";

import MealAttendees from "./MealAttendees";
import MealScanner from "./MealScanner";

export default function Meal({ mealId }: { mealId: string }) {
	return (
		<div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
			<div className="h-full min-w-0 rounded-xl border border-light-grey bg-white p-4 sm:p-6">
				<div className="mx-auto w-full max-w-sm overflow-hidden rounded-lg md:max-w-md lg:max-w-full">
					<MealScanner eventId={mealId} />
				</div>
			</div>

			<div className="flex h-full min-w-0 flex-col rounded-xl border border-light-grey bg-white p-4 sm:p-6">
				<h3 className="mb-3 font-semibold">Attendees</h3>
				<div className="max-h-[55vh] overflow-y-auto pr-1">
					<MealAttendees mealId={mealId} />
				</div>
			</div>
		</div>
	);
}
