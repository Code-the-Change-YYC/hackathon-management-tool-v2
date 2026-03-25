"use client";

import { useState } from "react";
import { api } from "@/trpc/react";
import MealAttendees from "./MealAttendees";
import MealScanner from "./MealScanner";

export default function Meal({ mealId }: { mealId: string }) {
	const [attendees, setAttendees] = useState<
		{ userId: string; userName: string; time: string }[]
	>([]);

	const addMealAttendee = api.meals.scanUserIn.useMutation();

	// expects a string in the form "userId::userName"
	function handleDetected(value: string) {
		const time = new Date().toISOString();
		const userInfo = value.split("::");
		const userId = userInfo[0];
		const userName = userInfo[1];

		if (!userId || !userName) return;
		if (userId === attendees[0]?.userId) return;

		const entry = { userId, userName, time };

		// add attendee to database and attendees list for UI to update
		addMealAttendee.mutate(
			{ userId, mealId },
			{
				onSuccess: () => {
					setAttendees((prev) => [entry, ...prev]);
				}
			}
		);
	}

	return (
		<div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
			<div className="h-full min-w-0 rounded-xl border border-light-grey bg-white p-4 sm:p-6">
				<div className="mx-auto w-full max-w-sm overflow-hidden rounded-lg md:max-w-md lg:max-w-full">
					<MealScanner onDetected={handleDetected} />
				</div>
			</div>

			<div className="flex h-full min-w-0 flex-col rounded-xl border border-light-grey bg-white p-4 sm:p-6">
				<h3 className="mb-3 font-semibold">Attendees</h3>
				<div className="max-h-[55vh] overflow-y-auto pr-1">
					<MealAttendees attendees={attendees} mealId={mealId} />
				</div>
			</div>
		</div>
	);
}
