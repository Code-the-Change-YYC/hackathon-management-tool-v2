import { AdminSidebar } from "@/app/components/admin/AdminSidebar";
import ScheduleView from "@/app/components/admin/schedule/ScheduleView";
import type { ScheduleItemData } from "@/app/components/ScheduleItem";
import { SidebarInset, SidebarProvider } from "@/app/components/ui/sidebar";
import { requireRole } from "@/server/better-auth/auth-helpers/helpers";
import { api } from "@/trpc/server";
import { Role } from "@/types/types";

export default async function AdminSchedulePage() {
	await requireRole([Role.ADMIN]);

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
		<SidebarProvider>
			<AdminSidebar userName="Victoria" />
			<SidebarInset>
				<ScheduleView items={scheduleItems} now={now} />
			</SidebarInset>
		</SidebarProvider>
	);
}
