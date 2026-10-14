import { connection } from "next/server";
import { SidebarInset, SidebarProvider } from "@/app/components/ui/sidebar";
import { resolveAvatarSrc } from "@/lib/avatars";
import { DEVPOST_URL, DISCORD_URL } from "@/lib/constants";
import { getNameParts } from "@/lib/names";
import { requireRole } from "@/server/better-auth/auth-helpers/helpers";
import { api } from "@/trpc/server";
import { Role } from "@/types/types";
import type { NavGroup, NavItem } from "../components/layout/AppSidebar";
import {
	AppSidebar,
	AppSidebarTriggerHeader
} from "../components/layout/AppSidebar";
import PageContainer from "../components/PageContainer";

export default async function ParticipantLayout({
	children
}: {
	children: React.ReactNode;
}) {
	// Stops prerendering to allow dynamically hiding/showing participant resources link
	await connection();
	const { user } = await requireRole([Role.PARTICIPANT, Role.ADMIN]);

	const settingsQuery = await api.hackathonSettings.get();
	const startDate = settingsQuery?.startDate;
	const showResources = startDate && Date.now() >= startDate?.getTime();

	const PARTICPANT_NAV_GROUPS: NavGroup[] = [
		{
			groupLabel: "Event Information",
			items: [
				{ title: "Dashboard", href: "/participant", icon: "home" },
				{ title: "Schedule", href: "/participant/schedule", icon: "calendar" },
				{ title: "Team", href: "/participant/team", icon: "group" },
				{
					title: "Meals",
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
				...(showResources
					? [
							{
								title: "Resources and Help",
								href: "/participant/resources",
								icon: "question"
							} as NavItem
						]
					: [])
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
