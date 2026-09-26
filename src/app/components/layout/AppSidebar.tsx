import { NotificationLine } from "@mingcute/react";
import {
	Avatar,
	AvatarFallback,
	AvatarImage
} from "@/app/components/ui/avatar";
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
import type { NavGroup } from "./sidebar-nav";

export type { NavGroup, NavIconKey, NavItem } from "./sidebar-nav";

interface AppSidebarProps {
	navGroups: NavGroup[];
	userName: string;
	avatarUrl?: string;
}

export function AppSidebar({
	navGroups,
	userName,
	avatarUrl
}: AppSidebarProps) {
	const initials = userName.slice(0, 1).toUpperCase();

	return (
		<Sidebar className="border-none" collapsible="offcanvas">
			<SidebarHeader className="p-4">
				<div className="flex items-center gap-2">
					<Avatar className="size-8">
						{avatarUrl ? <AvatarImage alt={userName} src={avatarUrl} /> : null}
						<AvatarFallback className="bg-primary text-primary-foreground">
							{initials}
						</AvatarFallback>
					</Avatar>
					<span className="flex-1 truncate font-medium text-sm">
						{userName}
					</span>
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
