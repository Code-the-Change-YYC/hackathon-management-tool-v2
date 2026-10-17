"use client";

import PageHeader from "@/app/components/PageHeader";
import { Schedule } from "@/app/components/Schedule";
import { Card, CardContent, CardHeader } from "@/app/components/ui/card";
import { useCurrentTime } from "@/hooks/use-current-time";
import type { RouterOutputs } from "@/trpc/react";
import { EventDetailsForm } from "./EventDetailsForm";

type Event = RouterOutputs["events"]["getAllEvents"][number];

export function ScheduleView({ events }: { events: Event[] }) {
	const now = useCurrentTime();

	return (
		<div className="flex flex-col gap-6">
			<PageHeader
				description="View all hackathon events and activities"
				title="Schedule"
			/>
			<Card>
				<CardHeader>
					<h2 className="font-medium text-xl">Event Schedule</h2>
				</CardHeader>
				<CardContent>
					<Schedule
						emptyDescription="Check back soon for event times."
						emptyTitle="No events have been scheduled yet"
						items={events.map((event) => ({
							...event,
							eventType: event.type
						}))}
						now={now}
					/>
				</CardContent>
			</Card>
			{events.length > 0 && (
				<section
					aria-labelledby="event-details-title"
					className="flex flex-col gap-4"
				>
					<h2 className="font-medium text-xl" id="event-details-title">
						Locations and Directions
					</h2>
					<div className="flex flex-col gap-3">
						{events.map((event) => (
							<EventDetailsForm event={event} key={event.id} />
						))}
					</div>
				</section>
			)}
		</div>
	);
}
