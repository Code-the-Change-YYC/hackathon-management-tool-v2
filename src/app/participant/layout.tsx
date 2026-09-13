import { SidebarInset, SidebarProvider } from "@/app/components/ui/sidebar";
import {
	AppSidebar,
	AppSidebarTriggerHeader
} from "../components/layout/AppSidebar";
import { requireRole } from "@/server/better-auth/auth-helpers/helpers";
import type { NavGroup } from "../components/layout/AppSidebar";
import { Role } from "@/types/types";

export default async function ParticipantLayout({
	children
}: {
	children: React.ReactNode;
}) {
	await requireRole([Role.PARTICIPANT, Role.ADMIN]);

	const DISCORD_URL = "https://discord.com/"; // TODO: Change to actual discord URL

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
					href: "participant/resources",
					icon: "question"
				}
			]
		},
		{
			groupLabel: "Quick Links",
			items: [
				{
					title: "Discord Join Link",
					href: DISCORD_URL,
					icon: "discord",
					external: true
				},
				{
					title: "Hackathon Home",
					href: "/",
					icon: "link",
					external: true
				}
			]
		}
	];

	return (
		<SidebarProvider>
			<AppSidebar navGroups={PARTICPANT_NAV_GROUPS} userName="Participant" />
			<SidebarInset>
				<AppSidebarTriggerHeader />
				{children}
			</SidebarInset>
		</SidebarProvider>
	);
}
