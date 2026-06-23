"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode, useState } from "react";
import {
	BellIcon,
	CloseIcon,
	DashboardIcon,
	HelpIcon,
	JudgingIcon,
	LinkIcon,
	MealIcon,
	MenuIcon,
	ScheduleIcon,
	TeamIcon
} from "./icons";

type NavItem = {
	label: string;
	href: string;
	icon: ReactNode;
	external?: boolean;
};

type NavSection = {
	heading: string;
	items: NavItem[];
};

const SECTIONS: NavSection[] = [
	{
		heading: "EVENT INFORMATION",
		items: [
			{ label: "Dashboard", href: "/participant", icon: <DashboardIcon /> },
			{ label: "Schedule", href: "/schedule", icon: <ScheduleIcon /> },
			{ label: "My Team", href: "/team", icon: <TeamIcon /> },
			{ label: "Meal Information", href: "/meal", icon: <MealIcon /> }
		]
	},
	{
		heading: "PROJECT RESOURCES",
		items: [
			{ label: "Judging Information", href: "/judging", icon: <JudgingIcon /> },
			{ label: "Resources and Help", href: "/resources", icon: <HelpIcon /> }
		]
	},
	{
		heading: "QUICK LINKS",
		items: [
			{
				label: "Discord Join Link",
				href: "https://discord.gg/codethechangeyyc",
				icon: <LinkIcon />,
				external: true
			},
			{ label: "Hackathon Home", href: "/", icon: <LinkIcon /> }
		]
	}
];

function NavLink({
	item,
	active,
	onNavigate
}: {
	item: NavItem;
	active: boolean;
	onNavigate: () => void;
}) {
	const className = `flex items-center gap-2 rounded-xl px-3 py-1.5 font-medium text-[14px] leading-5 transition ${
		active
			? "bg-purple-100 text-purple-800"
			: "text-grey-800 hover:bg-purple-50"
	}`;
	const content = (
		<>
			<span className="grid size-5 shrink-0 place-items-center text-current">
				{item.icon}
			</span>
			<span>{item.label}</span>
		</>
	);

	if (item.external) {
		return (
			<a
				className={className}
				href={item.href}
				onClick={onNavigate}
				rel="noopener noreferrer"
				target="_blank"
			>
				{content}
			</a>
		);
	}

	return (
		<Link className={className} href={item.href} onClick={onNavigate}>
			{content}
		</Link>
	);
}

function NavContent({
	userName,
	pathname,
	onNavigate
}: {
	userName?: string;
	pathname: string;
	onNavigate: () => void;
}) {
	const initial = (userName?.trim()?.[0] ?? "?").toUpperCase();

	return (
		<div className="flex h-full flex-col gap-5">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2">
					<span className="grid size-7 shrink-0 place-items-center rounded-full bg-orange-400 font-medium text-[14px] text-white">
						{initial}
					</span>
					<p className="font-medium text-[16px] text-grey-800 leading-6">
						{userName ?? "Guest"}
					</p>
				</div>
				<button
					aria-label="Notifications"
					className="grid size-9 place-items-center rounded-full text-grey-800 transition hover:bg-purple-50"
					type="button"
				>
					<BellIcon className="size-5" />
				</button>
			</div>

			<nav className="flex flex-col gap-5 overflow-y-auto pr-2">
				{SECTIONS.map((section, index) => (
					<div className="flex flex-col gap-4" key={section.heading}>
						{index > 0 && (
							<div className="h-px w-full rounded-full bg-grey-300" />
						)}
						<p className="font-medium text-[11px] text-grey-600 leading-4 tracking-wide">
							{section.heading}
						</p>
						<div className="flex flex-col gap-2">
							{section.items.map((item) => (
								<NavLink
									active={
										item.href !== "/" &&
										!item.external &&
										pathname.startsWith(item.href)
									}
									item={item}
									key={item.label}
									onNavigate={onNavigate}
								/>
							))}
						</div>
					</div>
				))}
			</nav>
		</div>
	);
}

export default function Sidebar({ userName }: { userName?: string }) {
	const pathname = usePathname();
	const [open, setOpen] = useState(false);
	const close = () => setOpen(false);

	return (
		<>
			<aside className="sticky top-0 hidden h-screen w-[209px] shrink-0 border-grey-300 border-r bg-[#fafafa] py-4 pr-2 pl-4 lg:block">
				<NavContent
					onNavigate={close}
					pathname={pathname}
					userName={userName}
				/>
			</aside>

			<header className="sticky top-0 z-30 flex items-center justify-between border-grey-300 border-b bg-[#fafafa] px-4 py-3 lg:hidden">
				<button
					aria-label="Open menu"
					className="grid size-9 place-items-center rounded-lg text-grey-800 transition hover:bg-purple-50"
					onClick={() => setOpen(true)}
					type="button"
				>
					<MenuIcon className="size-6" />
				</button>
				<div className="flex items-center gap-2">
					<span className="grid size-7 place-items-center rounded-full bg-orange-400 font-medium text-[14px] text-white">
						{(userName?.trim()?.[0] ?? "?").toUpperCase()}
					</span>
					<p className="font-medium text-[16px] text-grey-800">
						{userName ?? "Guest"}
					</p>
				</div>
				<button
					aria-label="Notifications"
					className="grid size-9 place-items-center rounded-full text-grey-800 transition hover:bg-purple-50"
					type="button"
				>
					<BellIcon className="size-5" />
				</button>
			</header>

			{open && (
				<div className="fixed inset-0 z-50 lg:hidden">
					<button
						aria-label="Close menu"
						className="absolute inset-0 bg-black/40"
						onClick={close}
						type="button"
					/>
					<div className="absolute top-0 left-0 h-full w-[260px] max-w-[80%] bg-[#fafafa] p-4 shadow-elevation-200">
						<button
							aria-label="Close menu"
							className="mb-2 ml-auto grid size-9 place-items-center rounded-lg text-grey-800 transition hover:bg-purple-50"
							onClick={close}
							type="button"
						>
							<CloseIcon className="size-5" />
						</button>
						<NavContent
							onNavigate={close}
							pathname={pathname}
							userName={userName}
						/>
					</div>
				</div>
			)}
		</>
	);
}
