"use client";

import { useRef } from "react";
import { api } from "@/trpc/react";
import MealAttendees from "./MealAttendees";
import MealScanner from "./MealScanner";

export default function Meal({ mealId }: { mealId: string }) {
	const recentScansRef = useRef<Map<string, number>>(new Map());
	const utils = api.useUtils();

	const addMealAttendee = api.meals.scanUserIn.useMutation();

	// expects a string in the form "userId::userName"
	function handleDetected(value: string) {
		const userInfo = value.split("::");
		const userId = userInfo[0];
		const userName = userInfo[1];

		if (!userId || !userName) return;

		addMealAttendee.mutate(
			{ userId, mealId },
			{
				onSuccess: () => {
					void utils.meals.getMealAttendees.invalidate({ id: mealId });
				},
				onError: () => {
					recentScansRef.current.delete(userId);
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
					<MealAttendees mealId={mealId} />
				</div>
			</div>
		</div>
	);
}
