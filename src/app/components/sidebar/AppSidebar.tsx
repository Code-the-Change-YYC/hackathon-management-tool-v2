import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarTrigger
} from "@/app/components/ui/sidebar";
import HackathonLogo from "./HackathonLogo";
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
			<SidebarHeader className="px-6 pt-6 pb-4">
				<HackathonLogo />
			</SidebarHeader>
			<SidebarContent className="px-2">
				{navGroups.map((group) => (
					<SidebarGroup key={group.groupLabel ?? group.items[0]?.href}>
						{group.groupLabel && (
							<SidebarGroupLabel className="uppercase tracking-wide">
								{group.groupLabel}
							</SidebarGroupLabel>
						)}
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
			<SidebarFooter>
				<SidebarUserMenu
					avatarUrl={avatarUrl}
					profileHref={profileHref}
					userName={userName}
				/>
			</SidebarFooter>
		</Sidebar>
	);
}

export function AppSidebarTriggerHeader() {
	return (
		<header className="flex items-center justify-between gap-2 border-b px-4 py-3 md:hidden">
			<SidebarTrigger />
		</header>
	);
}
