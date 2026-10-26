import { SidebarInset, SidebarProvider } from "@/app/components/ui/sidebar";
import { resolveAvatarSrc } from "@/lib/avatars";
import { getNameParts } from "@/lib/names";
import { requireRole } from "@/server/better-auth/auth-helpers/helpers";
import { Role } from "@/types/types";
import PageContainer from "../components/PageContainer";
import type { NavGroup } from "../components/sidebar/AppSidebar";
import {
	AppSidebar,
	AppSidebarTriggerHeader
} from "../components/sidebar/AppSidebar";

export default async function AdminLayout({
	children
}: {
	children: React.ReactNode;
}) {
	const { user } = await requireRole([Role.ADMIN]);

	const ADMIN_NAV_GROUPS: NavGroup[] = [
		{
			items: [
				{ title: "Schedule", href: "/admin/schedule", icon: "calendar" },
				{
					title: "Users",
					href: "/admin/users",
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
			groupLabel: "Portal Views",
			items: [
				{
					title: "Participant Dashboard",
					href: "/participant",
					icon: "link"
				},
				{ title: "Judge Dashboard", href: "/judge", icon: "link" }
			]
		}
	];

	return (
		<SidebarProvider>
			<AppSidebar
				avatarUrl={resolveAvatarSrc(user.image)}
				navGroups={ADMIN_NAV_GROUPS}
				userName={
					user.firstName || getNameParts(user.name).firstName || "Admin"
				}
			/>
			<SidebarInset>
				<AppSidebarTriggerHeader />
				<PageContainer>{children}</PageContainer>
			</SidebarInset>
		</SidebarProvider>
	);
}
