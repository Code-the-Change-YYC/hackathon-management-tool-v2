import type { ScheduleItemData } from "@/app/components/ScheduleItem";
import { ScheduleSection } from "@/app/components/ScheduleSection";
import { requireRole } from "@/server/better-auth/auth-helpers/helpers";
import { api } from "@/trpc/server";
import { EventType, Role } from "@/types/types";

export default async function Schedule() {
	await requireRole([Role.ADMIN]);

	const events = await api.events.getAllEvents();
	const now = new Date();

	const scheduleItems: ScheduleItemData[] = events.map((event) => ({
		id: event.id,
		title: event.title,
		startTime: event.startTime,
		endTime: event.endTime,
		eventType: EventType.FOOD,
		description: event.description
	}));

	return (
		<main className="flex size-full flex-1 flex-col overflow-y-auto bg-white">
			<div className="flex flex-col gap-[24px] p-[24px]">
				<div className="flex flex-col">
					<h1 className="font-semibold text-[32px] leading-[40px]">Schedule</h1>
					<p className="font-regular text-[16px] text-grey600 leading-[24px]">
						View all hackathon events and activities
					</p>
				</div>
				<ScheduleSection
					emptyDescription="Check back soon for event times."
					emptyTitle="No Events have been scheduled yet."
					items={scheduleItems}
					now={now}
					title="Event Schedule"
				/>
				{/* <FullSchedule /> */}
			</div>
		</main>
	);
}
