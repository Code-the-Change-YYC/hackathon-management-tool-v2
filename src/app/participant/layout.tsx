import { connection } from "next/server";
import { SidebarInset, SidebarProvider } from "@/app/components/ui/sidebar";
import { resolveAvatarSrc } from "@/lib/avatars";
import { DEVPOST_URL, DISCORD_URL } from "@/lib/constants";
import { getNameParts } from "@/lib/names";
import { hasHackathonStarted } from "@/lib/participant-events";
import { requireRole } from "@/server/better-auth/auth-helpers/helpers";
import { api } from "@/trpc/server";
import { Role } from "@/types/types";
import PageContainer from "../components/PageContainer";
import type { NavGroup, NavItem } from "../components/sidebar/AppSidebar";
import {
	AppSidebar,
	AppSidebarTriggerHeader
} from "../components/sidebar/AppSidebar";

export default async function ParticipantLayout({
	children
}: {
	children: React.ReactNode;
}) {
	// Stops prerendering to allow dynamically hiding/showing participant resources link
	await connection();
	const { user } = await requireRole([Role.PARTICIPANT, Role.ADMIN]);

	const settings = await api.hackathonSettings.get();

	const navItems: NavItem[] = [
		{ title: "Dashboard", href: "/participant", icon: "home" },
		{ title: "Schedule", href: "/participant/schedule", icon: "calendar" },
		{ title: "Team", href: "/participant/team", icon: "group" },
		{ title: "Meals", href: "/participant/meals", icon: "hamburger" },
		{
			title: "Important Info",
			href: "/participant/important-info",
			icon: "question"
		},
		{ title: "Judging", href: "/participant/judging", icon: "task" }
	];
	if (hasHackathonStarted(settings?.startDate)) {
		navItems.push({
			title: "Resources",
			href: "/participant/resources",
			icon: "question"
		});
	}

	const PARTICPANT_NAV_GROUPS: NavGroup[] = [
		{ items: navItems },
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
