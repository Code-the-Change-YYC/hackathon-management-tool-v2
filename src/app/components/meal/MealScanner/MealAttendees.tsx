"use client";

import { api } from "@/trpc/react";

export default function MealAttendees({ mealId }: { mealId: string }) {
	const getMealAttendees = api.meals.getMealAttendees.useQuery({ id: mealId });

	if (!getMealAttendees.data || getMealAttendees.data.length === 0) {
		return <div className="text-medium-grey text-sm">No attendees yet.</div>;
	}

	return (
		<ul className="space-y-2">
			{getMealAttendees.data.map((attendee) => (
				<li
					className="rounded-md border border-medium-grey p-2"
					key={attendee.id}
				>
					<div className="font-medium">{attendee.userName}</div>
					<div className="text-medium-grey text-xs">
						{new Date(attendee.createdAt).toLocaleString()}
					</div>
				</li>
			))}
		</ul>
	);
}
