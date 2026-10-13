import { SidebarInset, SidebarProvider } from "@/app/components/ui/sidebar";
import { resolveAvatarSrc } from "@/lib/avatars";
import { DEVPOST_URL, DISCORD_URL } from "@/lib/constants";
import { getNameParts } from "@/lib/names";
import { requireRole } from "@/server/better-auth/auth-helpers/helpers";
import { Role } from "@/types/types";
import PageContainer from "../components/PageContainer";
import type { NavGroup } from "../components/sidebar/AppSidebar";
import {
	AppSidebar,
	AppSidebarTriggerHeader
} from "../components/sidebar/AppSidebar";

export default async function ParticipantLayout({
	children
}: {
	children: React.ReactNode;
}) {
	const { user } = await requireRole([Role.PARTICIPANT, Role.ADMIN]);

	const PARTICPANT_NAV_GROUPS: NavGroup[] = [
		{
			items: [
				{ title: "Dashboard", href: "/participant", icon: "home" },
				{ title: "Schedule", href: "/participant/schedule", icon: "calendar" },
				{ title: "Team", href: "/participant/team", icon: "group" },
				{
					title: "Meals",
					href: "/participant/meals",
					icon: "hamburger"
				},
				{
					title: "Judging",
					href: "/participant/judging",
					icon: "task"
				},
				{
					title: "Resources",
					href: "/participant/resources",
					icon: "question"
				}
			]
		},
		{
			groupLabel: "Quick Links",
			items: [
				{
					title: "Discord",
					href: DISCORD_URL,
					icon: "discord",
					external: true
				},
				{
					title: "Devpost",
					href: DEVPOST_URL,
					icon: "code",
					external: true
				}
			]
		}
	];

	return (
		<SidebarProvider>
			<AppSidebar
				avatarUrl={resolveAvatarSrc(user.image)}
				navGroups={PARTICPANT_NAV_GROUPS}
				profileHref="/participant/profile"
				userName={
					user.firstName || getNameParts(user.name).firstName || "Participant"
				}
			/>
			<SidebarInset>
				<AppSidebarTriggerHeader />
				<PageContainer>{children}</PageContainer>
			</SidebarInset>
		</SidebarProvider>
	);
}
