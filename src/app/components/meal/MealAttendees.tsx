"use client";

import React from "react";

export default function MealAttendees({
	attendees
}: {
	attendees: { userId: string; time: string }[];
}) {
	if (!attendees || attendees.length === 0) {
		return <div className="text-medium-grey text-sm">No attendees yet.</div>;
	}

	return (
		<ul className="space-y-2">
			{attendees.map((a, i) => (
				<li
					className="rounded-md border border-medium-grey p-2"
					key={`${a.userId}-${a.time}-${i}`}
				>
					<div className="font-medium">{a.userId}</div>
					<div className="text-medium-grey text-xs">
						{new Date(a.time).toLocaleString()}
					</div>
				</li>
			))}
		</ul>
	);
}
