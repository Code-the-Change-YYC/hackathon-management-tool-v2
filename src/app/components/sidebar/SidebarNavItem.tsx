"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
	SidebarMenuButton,
	SidebarMenuItem
} from "@/app/components/ui/sidebar";
import { NAV_ICONS, type NavItem } from "./sidebar-nav";

export function SidebarNavItem({ item }: { item: NavItem }) {
	const pathname = usePathname();
	const isActive = pathname === item.href;
	const Icon = NAV_ICONS[item.icon][isActive ? "fill" : "line"];

	return (
		<SidebarMenuItem>
			<SidebarMenuButton
				isActive={isActive}
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
