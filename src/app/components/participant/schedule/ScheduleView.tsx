"use client";

import PageHeader from "@/app/components/PageHeader";
import { Schedule } from "@/app/components/Schedule";
import { Card, CardContent } from "@/app/components/ui/card";
import { useCurrentTime } from "@/hooks/use-current-time";
import { type DashboardEvent, getCurrentEvent } from "@/lib/participant-events";
import { CurrentEventBanner } from "../CurrentEventBanner";

export function ScheduleView({ events }: { events: DashboardEvent[] }) {
	const now = useCurrentTime();

	return (
		<div className="flex flex-col gap-6">
			<PageHeader
				description="View all hackathon events and activities"
				title="Schedule"
			/>
			<CurrentEventBanner
				colour="purple"
				event={getCurrentEvent(events, now)}
			/>
			<Card>
				<CardContent>
					<Schedule
						emptyDescription="Check back soon for hackathon events and activities."
						emptyTitle="No events have been scheduled yet"
						items={events}
						now={now}
					/>
				</CardContent>
			</Card>
		</div>
	);
}
