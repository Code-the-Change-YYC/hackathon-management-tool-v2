import { NotificationLine } from "@mingcute/react";
import type { ScheduleItemData } from "@/app/components/ScheduleItem";
import { ScheduleSection } from "@/app/components/ScheduleSection";
import { Button } from "@/app/components/ui/button";
import { SidebarTrigger } from "@/app/components/ui/sidebar";
import { api } from "@/trpc/server";
import PageHeader from "../../PageHeader";

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
			<header className="flex items-center justify-between gap-2 border-b px-4 py-3 md:hidden">
				<SidebarTrigger />
				<Button aria-label="Notifications" size="icon-sm" variant="ghost">
					<NotificationLine />
				</Button>
			</header>
			<div className="flex flex-col gap-6 p-6">
				<PageHeader
					description="View all hackathon events and activities"
					title="Schedule"
				/>
				<ScheduleSection
					emptyDescription="Check back soon for event times."
					emptyTitle="No Events have been scheduled yet."
					items={scheduleItems}
					now={now}
					title="Event Schedule"
				/>
			</div>
		</div>
	);
}
