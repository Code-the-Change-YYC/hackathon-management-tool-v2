"use client";

import {
	Calendar2Line,
	DiscordLine,
	GroupLine,
	HamburgerLine,
	Home4Line,
	LinkLine,
	NotificationLine,
	QuestionLine,
	Settings3Line,
	TaskLine,
	User3Line
} from "@mingcute/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarTrigger
} from "@/app/components/ui/sidebar";

const NAV_ICONS = {
	home: Home4Line,
	calendar: Calendar2Line,
	group: GroupLine,
	hamburger: HamburgerLine,
	link: LinkLine,
	task: TaskLine,
	question: QuestionLine,
	discord: DiscordLine,
	user: User3Line,
	settings: Settings3Line
} as const;

export type NavIconKey = keyof typeof NAV_ICONS;

export interface NavGroup {
	groupLabel: string;
	items: NavItem[];
}

export interface NavItem {
	title: string;
	href: string;
	icon: NavIconKey;
	external?: boolean;
}

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
	const pathname = usePathname();
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
									<AppSidebarItem
										item={item}
										key={item.href}
										pathname={pathname}
									/>
								))}
							</SidebarMenu>
						</SidebarGroupContent>
					</SidebarGroup>
				))}
			</SidebarContent>
		</Sidebar>
	);
}

function AppSidebarItem({
	item,
	pathname
}: {
	item: NavItem;
	pathname: string;
}) {
	const Icon = NAV_ICONS[item.icon];

	return (
		<SidebarMenuItem>
			<SidebarMenuButton
				isActive={pathname === item.href}
				render={
					<Link
						href={item.href}
						rel={item.external ? "noopener noreferrer" : undefined}
						target={item.external ? "_blank" : undefined}
					/>
				}
				tooltip={item.title}
			>
				<Icon />
				<span>{item.title}</span>
			</SidebarMenuButton>
		</SidebarMenuItem>
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
