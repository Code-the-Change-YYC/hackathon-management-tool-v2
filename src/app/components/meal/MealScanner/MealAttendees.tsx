"use client";

import { formatDateTime } from "@/lib/datetime";
import { api } from "@/trpc/react";

export default function MealAttendees({
	mealId,
	search
}: {
	mealId: string;
	search: string;
}) {
	const getMealAttendees = api.events.getEventAttendees.useQuery({
		eventId: mealId
	});

	if (!getMealAttendees.data || getMealAttendees.data.length === 0) {
		return <div className="text-medium-grey text-sm">No attendees yet.</div>;
	}

	const query = search.trim().toLowerCase();
	const attendees = getMealAttendees.data.filter((attendee) =>
		attendee.userName.toLowerCase().includes(query)
	);

	if (attendees.length === 0) {
		return (
			<div className="text-muted-foreground text-sm">
				No matching attendees.
			</div>
		);
	}

	return (
		<ul className="space-y-2">
			{attendees.map((attendee) => (
				<li
					className="rounded-md border border-medium-grey p-2"
					key={attendee.id}
				>
					<div className="font-medium">{attendee.userName}</div>
					<div className="text-medium-grey text-xs">
						{formatDateTime(attendee.createdAt)}
					</div>
				</li>
			))}
		</ul>
	);
}
