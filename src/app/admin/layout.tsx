import { SidebarInset, SidebarProvider } from "@/app/components/ui/sidebar";
import { requireRole } from "@/server/better-auth/auth-helpers/helpers";
import { Role } from "@/types/types";
import type { NavGroup } from "../components/layout/AppSidebar";
import {
	AppSidebar,
	AppSidebarTriggerHeader
} from "../components/layout/AppSidebar";

export default async function AdminLayout({
	children
}: {
	children: React.ReactNode;
}) {
	await requireRole([Role.ADMIN]);

	const ADMIN_NAV_GROUPS: NavGroup[] = [
		{
			groupLabel: "Event Management",
			items: [
				{ title: "Schedule", href: "/admin/schedule", icon: "calendar" },
				{
					title: "Registered Users",
					href: "/admin/participants",
					icon: "user"
				},
				{ title: "Teams", href: "/admin/teams", icon: "group" },
				{ title: "Meals", href: "/admin/meals", icon: "hamburger" },
				{
					title: "Judging Information",
					href: "/admin/judging",
					icon: "task"
				}
			]
		},
		{
			groupLabel: "App Management",
			items: [{ title: "Admin Controls", href: "/admin", icon: "settings" }]
		}
	];

	return (
		<SidebarProvider>
			<AppSidebar navGroups={ADMIN_NAV_GROUPS} userName="Admin User" />
			<SidebarInset>
				<AppSidebarTriggerHeader />
				{children}
			</SidebarInset>
		</SidebarProvider>
	);
}
