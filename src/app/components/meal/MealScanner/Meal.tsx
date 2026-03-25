"use client";

import { useState } from "react";
import { api } from "@/trpc/react";
import MealAttendees from "./MealAttendees";
import MealScanner from "./MealScanner";

export default function Meal({ mealId }: { mealId: string }) {
	const [attendees, setAttendees] = useState<
		{ userId: string; time: string }[]
	>([]);
	const [lastScanned, setLastScanned] = useState<{
		userId: string;
		time: string;
	} | null>(null);

	const addMealAttendee = api.meals.scanUserIn.useMutation();

	function handleDetected(value: string) {
		const time = new Date().toISOString();
		const userId = String(value);
		const entry = { userId, time };
		addMealAttendee.mutate({ userId, mealId });
		setAttendees((prev) => [entry, ...prev]);
		setLastScanned(entry);
	}

	return (
		<div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
			<div className="h-full min-w-0 rounded-xl border border-light-grey bg-white p-4 sm:p-6">
				<div className="mx-auto w-full max-w-sm overflow-hidden rounded-lg md:max-w-md lg:max-w-full">
					<MealScanner onDetected={handleDetected} />
				</div>
				{lastScanned && (
					<div className="mt-4 rounded-md bg-green-50 p-3 text-sm">
						Scanned <span className="font-semibold">{lastScanned.userId}</span>{" "}
						at {new Date(lastScanned.time).toLocaleString()}
					</div>
				)}
			</div>

			<div className="flex h-full min-w-0 flex-col rounded-xl border border-light-grey bg-white p-4 sm:p-6">
				<h3 className="mb-3 font-semibold">Attendees</h3>
				<div className="max-h-[55vh] overflow-y-auto pr-1">
					<MealAttendees attendees={attendees} />
				</div>
			</div>
		</div>
	);
}
