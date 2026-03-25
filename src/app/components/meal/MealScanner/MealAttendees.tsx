"use client";

import { api } from "@/trpc/react";

export default function MealAttendees({
	attendees,
	mealId
}: {
	attendees: { userId: string; userName: string; time: string }[];
	mealId: string;
}) {
	const getMealAttendees = api.meals.getMealAttendees.useQuery({ id: mealId });

	const dbAttendees =
		getMealAttendees.data?.map((attendee) => ({
			userId: attendee.userId,
			userName: attendee.userName,
			time: new Date(attendee.createdAt).toLocaleString()
		})) ?? [];

	const allAttendees = [...attendees, ...dbAttendees];

	if (allAttendees.length === 0) {
		return <div className="text-medium-grey text-sm">No attendees yet.</div>;
	}

	return (
		<ul className="space-y-2">
			{allAttendees.map((a) => (
				<li className="rounded-md border border-medium-grey p-2" key={a.userId}>
					<div className="font-medium">{a.userName}</div>
					<div className="text-medium-grey text-xs">
						{new Date(a.time).toLocaleString()}
					</div>
				</li>
			))}
		</ul>
	);
}
