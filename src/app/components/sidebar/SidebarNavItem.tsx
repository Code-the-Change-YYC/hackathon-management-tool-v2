"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
	SidebarMenuButton,
	SidebarMenuItem,
	useSidebar
} from "@/app/components/ui/sidebar";
import { NAV_ICONS, type NavItem } from "./sidebar-nav";

export function SidebarNavItem({ item }: { item: NavItem }) {
	const pathname = usePathname();
	const { setOpenMobile } = useSidebar();
	const isActive = pathname === item.href;
	const Icon = NAV_ICONS[item.icon][isActive ? "fill" : "line"];

	return (
		<SidebarMenuItem>
			<SidebarMenuButton
				isActive={isActive}
				render={
					<Link
						href={item.href}
						// On phones the sidebar is a sheet over the page, so close it.
						onClick={() => setOpenMobile(false)}
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
