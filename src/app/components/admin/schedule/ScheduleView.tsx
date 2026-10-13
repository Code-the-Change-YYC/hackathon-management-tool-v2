import { Schedule } from "@/app/components/Schedule";
import type { ScheduleItemData } from "@/app/components/ScheduleItem";
import { api } from "@/trpc/server";
import PageHeader from "../../PageHeader";
import { EventDetailsForm } from "./EventDetailsForm";

export default async function ScheduleView() {
	const events = await api.events.getAllEvents();
	const now = new Date();

	const scheduleItems: ScheduleItemData[] = events.map((event) => ({
		id: event.id,
		title: event.title,
		startTime: event.startTime,
		endTime: event.endTime,
		eventType: event.type,
		description: event.description
	}));

	return (
		<div className="flex min-h-svh flex-1 flex-col overflow-y-auto bg-white">
			<div className="flex flex-col gap-6 p-6">
				<PageHeader
					description="View all hackathon events and activities"
					title="Schedule"
				/>
				<section className="flex flex-col gap-5">
					<h2 className="font-medium text-dark-grey text-lg">Event Schedule</h2>
					<Schedule
						emptyDescription="Check back soon for event times."
						emptyTitle="No Events have been scheduled yet."
						items={scheduleItems}
						now={now}
					/>
				</section>
				<section
					aria-label="Event locations and directions"
					className="flex flex-col gap-3"
				>
					{events.map((event) => (
						<EventDetailsForm event={event} key={event.id} />
					))}
				</section>
			</div>
		</div>
	);
}
