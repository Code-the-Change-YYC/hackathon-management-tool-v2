"use client";

import {
	Calendar2Line,
	GroupLine,
	HamburgerLine,
	NotificationLine,
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
	SidebarMenuItem
} from "@/app/components/ui/sidebar";

type NavItem = {
	title: string;
	href: string;
	icon: typeof User3Line;
};

const EVENT_MANAGEMENT_ITEMS: NavItem[] = [
	{ title: "Schedule", href: "/admin/schedule", icon: Calendar2Line },
	{ title: "Registered Users", href: "/admin/participants", icon: User3Line },
	{ title: "Teams", href: "/admin/teams", icon: GroupLine },
	{ title: "Meals", href: "/admin/meals", icon: HamburgerLine },
	{
		title: "Judging Information",
		href: "/admin/judging",
		icon: TaskLine
	}
];

const ADMIN_MANAGEMENT_ITEMS: NavItem[] = [
	{ title: "Admin Controls", href: "/admin", icon: Settings3Line }
];

type AdminSidebarProps = {
	userName: string;
	avatarUrl?: string;
};

export function AdminSidebar({ userName, avatarUrl }: AdminSidebarProps) {
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
				<SidebarGroup>
					<SidebarGroupLabel className="uppercase tracking-wide">
						Event Management
					</SidebarGroupLabel>
					<SidebarGroupContent>
						<SidebarMenu>
							{EVENT_MANAGEMENT_ITEMS.map((item) => (
								<AdminSidebarItem
									item={item}
									key={item.href}
									pathname={pathname}
								/>
							))}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
				<SidebarGroup>
					<SidebarGroupLabel className="uppercase tracking-wide">
						App Management
					</SidebarGroupLabel>
					<SidebarGroupContent>
						<SidebarMenu>
							{ADMIN_MANAGEMENT_ITEMS.map((item) => (
								<AdminSidebarItem
									item={item}
									key={item.href}
									pathname={pathname}
								/>
							))}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>
		</Sidebar>
	);
}

function AdminSidebarItem({
	item,
	pathname
}: {
	item: NavItem;
	pathname: string;
}) {
	const Icon = item.icon;

	return (
		<SidebarMenuItem>
			<SidebarMenuButton
				isActive={pathname === item.href}
				render={<Link href={item.href} />}
				tooltip={item.title}
			>
				<Icon />
				<span>{item.title}</span>
			</SidebarMenuButton>
		</SidebarMenuItem>
	);
}
