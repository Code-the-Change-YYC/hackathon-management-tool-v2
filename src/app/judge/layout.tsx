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

export default async function JudgeLayout({
	children
}: {
	children: React.ReactNode;
}) {
	const { user } = await requireRole([Role.JUDGE, Role.ADMIN]);

	const JUDGE_NAV_GROUPS: NavGroup[] = [
		{
			items: [
				{ title: "Dashboard", href: "/judge", icon: "home" },
				{ title: "Schedule", href: "/judge/schedule", icon: "calendar" },
				{ title: "Rubric", href: "/judge/rubric", icon: "task" }
			]
		}
	];

	return (
		<SidebarProvider>
			<AppSidebar
				avatarUrl={resolveAvatarSrc(user.image)}
				navGroups={JUDGE_NAV_GROUPS}
				userName={
					user.firstName || getNameParts(user.name).firstName || "Judge"
				}
			/>
			<SidebarInset>
				<AppSidebarTriggerHeader />
				<PageContainer>{children}</PageContainer>
			</SidebarInset>
		</SidebarProvider>
	);
}
