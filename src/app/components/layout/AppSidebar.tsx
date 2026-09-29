import { NotificationLine } from "@mingcute/react";
import { Button } from "@/app/components/ui/button";
import {
	Sidebar,
	SidebarContent,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarTrigger
} from "@/app/components/ui/sidebar";
import { SidebarNavItem } from "./SidebarNavItem";
import { SidebarUserMenu } from "./SidebarUserMenu";
import type { NavGroup } from "./sidebar-nav";

export type { NavGroup, NavIconKey, NavItem } from "./sidebar-nav";

interface AppSidebarProps {
	navGroups: NavGroup[];
	userName: string;
	avatarUrl?: string;
	profileHref?: string;
}

export function AppSidebar({
	navGroups,
	userName,
	avatarUrl,
	profileHref
}: AppSidebarProps) {
	return (
		<Sidebar className="border-none" collapsible="offcanvas">
			<SidebarHeader className="p-4">
				<div className="flex items-center gap-2">
					<SidebarUserMenu
						avatarUrl={avatarUrl}
						profileHref={profileHref}
						userName={userName}
					/>
					<Button aria-label="Notifications" size="icon-sm" variant="ghost">
						<NotificationLine />
					</Button>
				</div>
			</SidebarHeader>
			<SidebarContent className="px-2">
				{navGroups.map((group) => (
					<SidebarGroup key={group.groupLabel}>
						<SidebarGroupLabel className="uppercase tracking-wide">
							{group.groupLabel}
						</SidebarGroupLabel>
						<SidebarGroupContent>
							<SidebarMenu>
								{group.items.map((item) => (
									<SidebarNavItem item={item} key={item.href} />
								))}
							</SidebarMenu>
						</SidebarGroupContent>
					</SidebarGroup>
				))}
			</SidebarContent>
		</Sidebar>
	);
}

export function AppSidebarTriggerHeader() {
	return (
		<header className="flex items-center justify-between gap-2 border-b px-4 py-3 md:hidden">
			<SidebarTrigger />
			<Button aria-label="Notifications" size="icon-sm" variant="ghost">
				<NotificationLine />
			</Button>
		</header>
	);
}
