"use client";

import PageHeader from "@/app/components/PageHeader";
import type { HackathonDateSettings } from "@/lib/validation/hackathon-dates";
import type { AdminEvent } from "./EventDialog";
import { EventsCard } from "./EventsCard";
import { HackathonDatesCard } from "./HackathonDatesCard";

export function ScheduleView({
	events,
	settings
}: {
	events: AdminEvent[];
	settings: HackathonDateSettings | null;
}) {
	return (
		<div className="flex flex-col gap-6">
			<PageHeader
				description="Manage hackathon dates and events."
				title="Schedule"
			/>
			<HackathonDatesCard
				eventStarts={events.map((event) => event.startTime)}
				settings={settings}
			/>
			<EventsCard events={events} settings={settings} />
		</div>
	);
}
