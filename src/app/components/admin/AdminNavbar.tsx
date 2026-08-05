"use client";

import {
	Calendar2Line,
	ClipboardLine,
	GroupLine,
	NotificationLine,
	Settings1Line,
	TaskLine,
	User1Line
} from "@mingcute/react";
import Image from "next/image";
import Link from "next/link";
import type { ComponentType, ReactNode } from "react";
import { Separator } from "@/app/components/ui/separator";
import { cn } from "@/lib/utils";

type NavbarIcon = ComponentType<{ className?: string }>;

function NavbarItem({
	active,
	href,
	icon: Icon,
	label,
	onNavigate
}: {
	active?: boolean;
	href: string;
	icon: NavbarIcon;
	label: string;
	onNavigate?: () => void;
}) {
	return (
		<li>
			<Link
				aria-current={active ? "page" : undefined}
				className={cn(
					"flex items-center gap-1 rounded-lg px-3 py-1.5 font-medium text-sm transition-colors",
					active
						? "bg-sidebar-accent text-foreground"
						: "text-foreground hover:bg-muted"
				)}
				href={href}
				onClick={onNavigate}
			>
				<Icon className="size-5 shrink-0" />
				<span>{label}</span>
			</Link>
		</li>
	);
}

function NavbarSection({
	children,
	title
}: {
	children: ReactNode;
	title: string;
}) {
	return (
		<div className="flex flex-col gap-4">
			<p className="m-0 font-medium text-[11px] text-muted-foreground leading-4">
				{title}
			</p>
			<ul className="m-0 flex list-none flex-col gap-1 p-0">{children}</ul>
		</div>
	);
}

export function AdminNavbar({
	onNavigate,
	userName
}: {
	onNavigate?: () => void;
	userName: string;
}) {
	return (
		<div className="flex h-full flex-col gap-5">
			<div className="flex items-center justify-between">
				<div className="flex min-w-0 items-center gap-2">
					<Image
						alt=""
						className="size-7 shrink-0 rounded-full bg-pinky-peach"
						height={28}
						src="/images/admin-judging/avatar.png"
						width={28}
					/>
					<span className="truncate font-medium text-base">{userName}</span>
				</div>
				<span aria-hidden="true" className="p-2">
					<NotificationLine className="size-6" />
				</span>
			</div>

			<nav aria-label="Admin navigation" className="flex flex-col gap-5">
				<NavbarSection title="EVENT MANAGEMENT">
					<NavbarItem
						href="/admin/judge#judging-schedule"
						icon={Calendar2Line}
						label="Schedule"
						onNavigate={onNavigate}
					/>
					<NavbarItem
						href="/admin#users"
						icon={User1Line}
						label="Registered Users"
						onNavigate={onNavigate}
					/>
					<NavbarItem
						href="/admin#teams"
						icon={GroupLine}
						label="Teams"
						onNavigate={onNavigate}
					/>
					<NavbarItem
						href="/meal"
						icon={TaskLine}
						label="Meals"
						onNavigate={onNavigate}
					/>
					<NavbarItem
						active
						href="/admin/judge"
						icon={ClipboardLine}
						label="Judging Information"
						onNavigate={onNavigate}
					/>
				</NavbarSection>

				<Separator />

				<NavbarSection title="APP MANAGEMENT">
					<NavbarItem
						href="/admin"
						icon={Settings1Line}
						label="Admin Controls"
						onNavigate={onNavigate}
					/>
				</NavbarSection>
			</nav>
		</div>
	);
}
