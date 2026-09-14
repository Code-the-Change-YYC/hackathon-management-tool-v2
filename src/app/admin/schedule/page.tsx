import { AdminSidebar } from "@/app/components/admin/AdminSidebar";
import ScheduleView from "@/app/components/admin/schedule/ScheduleView";
import { SidebarInset, SidebarProvider } from "@/app/components/ui/sidebar";
import { requireRole } from "@/server/better-auth/auth-helpers/helpers";
import { Role } from "@/types/types";

export default async function AdminSchedulePage() {
	await requireRole([Role.ADMIN]);

	return (
		<SidebarProvider>
			<AdminSidebar userName="Victoria" />
			<SidebarInset>
				<ScheduleView />
			</SidebarInset>
		</SidebarProvider>
	);
}
