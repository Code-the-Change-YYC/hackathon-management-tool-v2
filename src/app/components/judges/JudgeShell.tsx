"use client";

import {
	Calendar2Line,
	ClipboardLine,
	Home1Line,
	More1Line,
	NotificationLine
} from "@mingcute/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ComponentType, type ReactNode, useState } from "react";
import { MobileNavSheet } from "@/app/components/MobileNavSheet";
import { Button } from "@/app/components/ui/button";
import { cn } from "@/lib/utils";
import { JudgeUserContext } from "./useJudgePortalData";

type JudgeNavIcon = ComponentType<{ className?: string }>;

const navItems: Array<{ href: string; icon: JudgeNavIcon; label: string }> = [
	{ href: "/judge", icon: Home1Line, label: "Dashboard" },
	{ href: "/judge/schedule", icon: Calendar2Line, label: "Schedule" },
	{ href: "/judge/rubric", icon: ClipboardLine, label: "Rubric" }
];

function isActivePath(pathname: string, href: string) {
	if (href === "/judge") {
		return pathname === "/judge" || pathname === "/judge/";
	}
	return pathname === href || pathname.startsWith(`${href}/`);
}

function JudgeNavContent({
	onNavigate,
	userName
}: {
	onNavigate?: () => void;
	userName: string;
}) {
	const pathname = usePathname();
	const initial = userName.trim().charAt(0).toUpperCase() || "J";

	return (
		<div className="flex h-full flex-col gap-5">
			<div className="flex items-center justify-between">
				<div className="flex min-w-0 items-center gap-2">
					<span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#fe957b] font-semibold text-sm text-white">
						{initial}
					</span>
					<span className="truncate font-medium text-base text-foreground">
						{userName}
					</span>
				</div>
				<span aria-hidden="true" className="p-2 text-foreground">
					<NotificationLine className="size-6" />
				</span>
			</div>

			<nav aria-label="Judge navigation" className="flex flex-col gap-4">
				<p className="m-0 font-medium text-[11px] text-muted-foreground leading-4">
					JUDGING INFORMATION
				</p>
				<ul className="m-0 flex list-none flex-col gap-1 p-0">
					{navItems.map((item) => {
						const active = isActivePath(pathname, item.href);
						const Icon = item.icon;
						return (
							<li key={item.href}>
								<Link
									aria-current={active ? "page" : undefined}
									className={cn(
										"flex items-center gap-1 rounded-lg px-3 py-1.5 font-medium text-sm transition-colors",
										active
											? "bg-accent text-foreground"
											: "text-foreground hover:bg-muted"
									)}
									href={item.href}
									onClick={onNavigate}
								>
									<Icon className="size-5 shrink-0" />
									<span>{item.label}</span>
								</Link>
							</li>
						);
					})}
				</ul>
			</nav>
		</div>
	);
}

export function JudgeShell({
	children,
	userId,
	userName
}: {
	children: ReactNode;
	userId: string;
	userName: string;
}) {
	const pathname = usePathname();
	const [menuOpen, setMenuOpen] = useState(false);
	const isScorePath = pathname.startsWith("/judge/score/");

	return (
		<JudgeUserContext.Provider value={{ userId, userName }}>
			<div
				className="min-h-screen bg-background text-foreground"
				style={{ fontFamily: "var(--font-omnes), sans-serif" }}
			>
				<aside className="fixed inset-y-0 left-0 hidden w-[209px] border-border border-r bg-sidebar py-4 pr-4 pl-4 lg:block">
					<JudgeNavContent userName={userName} />
				</aside>

				<header className="flex h-14 items-center justify-between bg-background px-6 py-1 lg:hidden">
					<Button
						aria-expanded={menuOpen}
						aria-label="Open judge navigation"
						onClick={() => setMenuOpen(true)}
						size="icon-lg"
						type="button"
						variant="ghost"
					>
						<More1Line />
					</Button>
					<span aria-hidden="true" className="p-2 text-foreground">
						<NotificationLine className="size-6" />
					</span>
				</header>

				<div className="lg:hidden">
					<MobileNavSheet
						onOpenChange={setMenuOpen}
						open={menuOpen}
						title="Judge navigation"
					>
						<JudgeNavContent
							onNavigate={() => setMenuOpen(false)}
							userName={userName}
						/>
					</MobileNavSheet>
				</div>

				<main
					className={
						isScorePath
							? "flex flex-col lg:ml-[209px]"
							: "flex flex-col gap-5 px-6 py-6 lg:ml-[209px]"
					}
				>
					{children}
				</main>
			</div>
		</JudgeUserContext.Provider>
	);
}
