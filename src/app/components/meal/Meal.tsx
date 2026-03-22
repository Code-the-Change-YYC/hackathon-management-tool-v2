"use client";

import React, { useState } from "react";
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
		<div className="grid gap-6 md:grid-cols-2">
			<div>
				<div className="rounded-xl border border-light-grey bg-white p-6">
					<MealScanner onDetected={handleDetected} />
					{lastScanned && (
						<div className="mt-4 rounded-md bg-green-50 p-3 text-sm">
							Scanned{" "}
							<span className="font-semibold">{lastScanned.userId}</span> at{" "}
							{new Date(lastScanned.time).toLocaleString()}
						</div>
					)}
				</div>
			</div>

			<div>
				<div className="rounded-xl border border-light-grey bg-white p-6">
					<h3 className="mb-3 font-semibold">Attendees</h3>
					<MealAttendees attendees={attendees} />
				</div>
			</div>
		</div>
	);
}
