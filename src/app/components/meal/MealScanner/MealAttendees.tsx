"use client";

import { Badge } from "@/app/components/ui/badge";
import { formatDateTime } from "@/lib/datetime";
import { cn } from "@/lib/utils";
import {
	DIETARY_RESTRICTION_LABELS,
	toDietaryRestrictions
} from "@/lib/validation/signup";
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

	const latestAttendanceId = getMealAttendees.data[0]?.id;
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
		<ul className="flex flex-col gap-2">
			{attendees.map((attendee) => {
				const isLatest = attendee.id === latestAttendanceId;
				const restrictions = toDietaryRestrictions(
					attendee.dietaryRestrictions
				);
				return (
					<li
						className={cn(
							"rounded-md border border-medium-grey p-2",
							!isLatest && "mx-4"
						)}
						data-attendee-id={attendee.userId}
						key={attendee.id}
					>
						<div className="flex flex-wrap items-center gap-x-4 gap-y-1">
							<span className={cn("font-medium", isLatest && "font-semibold")}>
								{attendee.userName}
							</span>
							{restrictions.length > 0 && (
								<div className="ml-auto flex flex-wrap justify-end gap-1">
									{restrictions.map((restriction) => (
										<Badge
											className="h-4 px-1.5 py-0 text-xs"
											key={restriction}
											variant="destructive"
										>
											{DIETARY_RESTRICTION_LABELS[restriction]}
										</Badge>
									))}
								</div>
							)}
						</div>
						<div className="text-medium-grey text-xs">
							{formatDateTime(attendee.createdAt)}
						</div>
					</li>
				);
			})}
		</ul>
	);
}
