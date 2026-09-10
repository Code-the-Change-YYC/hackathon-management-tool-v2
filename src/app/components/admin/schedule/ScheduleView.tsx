import { NotificationLine } from "@mingcute/react";
import type { ScheduleItemData } from "@/app/components/ScheduleItem";
import { ScheduleSection } from "@/app/components/ScheduleSection";
import { Button } from "@/app/components/ui/button";
import { SidebarTrigger } from "@/app/components/ui/sidebar";

export default function ScheduleView({
	items,
	now
}: {
	items: ScheduleItemData[];
	now: Date;
}) {
	return (
		<div className="flex min-h-svh flex-1 flex-col overflow-y-auto bg-white">
			<header className="flex items-center justify-between gap-2 border-b px-4 py-3 md:hidden">
				<SidebarTrigger />
				<Button aria-label="Notifications" size="icon-sm" variant="ghost">
					<NotificationLine />
				</Button>
			</header>
			<div className="flex flex-col gap-6 p-6">
				<div className="flex flex-col">
					<h1 className="font-semibold text-[32px] leading-10">Schedule</h1>
					<p className="font-regular text-[16px] text-grey600 leading-6">
						View all hackathon events and activities
					</p>
				</div>
				<ScheduleSection
					emptyDescription="Check back soon for event times."
					emptyTitle="No Events have been scheduled yet."
					items={items}
					now={now}
					title="Event Schedule"
				/>
			</div>
		</div>
	);
}
