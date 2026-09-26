import { SidebarInset, SidebarProvider } from "@/app/components/ui/sidebar";
import { resolveAvatarSrc } from "@/lib/avatars";
import { getNameParts } from "@/lib/names";
import { requireRole } from "@/server/better-auth/auth-helpers/helpers";
import { Role } from "@/types/types";
import type { NavGroup } from "../components/layout/AppSidebar";
import {
	AppSidebar,
	AppSidebarTriggerHeader
} from "../components/layout/AppSidebar";

export default async function ParticipantLayout({
	children
}: {
	children: React.ReactNode;
}) {
	const { user } = await requireRole([Role.PARTICIPANT, Role.ADMIN]);

	const DISCORD_URL = "https://discord.gg/bhJnwXjJYP";
	const DEVPOST_URL = "https://hack-the-change-2026.devpost.com/";

	const PARTICPANT_NAV_GROUPS: NavGroup[] = [
		{
			groupLabel: "Event Information",
			items: [
				{ title: "Dashboard", href: "/participant", icon: "home" },
				{ title: "Schedule", href: "/participant/schedule", icon: "calendar" },
				{ title: "My Team", href: "/participant/team", icon: "group" },
				{
					title: "Meal Information",
					href: "/participant/meals",
					icon: "hamburger"
				}
			]
		},
		{
			groupLabel: "Project Resources",
			items: [
				{
					title: "Judging Information",
					href: "/participant/judging",
					icon: "task"
				},
				{
					title: "Resources and Help",
					href: "/participant/resources",
					icon: "question"
				}
			]
		},
		{
			groupLabel: "Quick Links",
			items: [
				{
					title: "Hackathon Home",
					href: "/",
					icon: "link",
					external: true
				},
				{
					title: "Discord Join Link",
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
				userName={getNameParts(user.name).firstName || "Participant"}
			/>
			<SidebarInset>
				<AppSidebarTriggerHeader />
				{children}
			</SidebarInset>
		</SidebarProvider>
	);
}
