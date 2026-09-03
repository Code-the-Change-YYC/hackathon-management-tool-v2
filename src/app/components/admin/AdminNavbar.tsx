"use client";

import {
	Calendar2Line,
	Group3Line,
	HamburgerLine,
	MenuLine,
	NotificationLine,
	TaskLine,
	User1Line
} from "@mingcute/react";
import type { User } from "better-auth";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { type Ref, useCallback, useEffect, useRef, useState } from "react";
import { twMerge } from "tailwind-merge";
import { Avatar, AvatarImage } from "../ui/avatar";

function NavbarTitle({ text }: { text: string }) {
	return (
		<p className="font-medium text-[11px] text-grey600 leading-4">{text}</p>
	);
}

function NavbarLink({
	children,
	href,
	closeCallback = () => {}
}: {
	children: React.ReactNode;
	href: string;
	closeCallback?: () => void;
}) {
	const pathName = usePathname();

	return (
		<Link
			className={twMerge(
				"flex flex-row items-center gap-1 rounded-[12px] px-3 py-1.5",
				pathName === href ? "bg-accent mix-blend-multiply" : ""
			)}
			href={href}
			onClick={closeCallback}
		>
			{children}
		</Link>
	);
}

function NavbarDivider() {
	return <div className="h-px w-full rounded-full bg-ehhh-grey" />;
}

function NavbarLinks({
	ref,
	className = "",
	closeCallback,
	user
}: {
	ref?: Ref<HTMLDivElement>;
	className?: string;
	closeCallback: () => void;
	user: User;
}) {
	return (
		<div
			className={twMerge(
				"h-screen w-52.25 flex-col gap-5 bg-white py-4 pr-2 pl-4",
				className
			)}
			ref={ref}
		>
			<div className="flex h-12 flex-row items-center justify-between">
				<div className="flex h-full flex-row items-center gap-2">
					<Avatar>
						<AvatarImage src={user.image ?? ""} />
					</Avatar>
					<p className="font-medium text-[16px] leading-6">{user.name}</p>
				</div>
				<NotificationLine className="hidden h-full w-12 p-3 lg:flex" />
			</div>
			<div className="flex flex-col gap-5 pr-2">
				<div className="flex flex-col gap-4">
					<NavbarTitle text="EVENT MANAGEMENT" />

					<NavbarLink closeCallback={closeCallback} href="/admin/schedule">
						<Calendar2Line className="h-5 w-5" />
						<p className="whitespace-nowrap align-middle font-medium text-[14px] text-grey800 leading-5 tracking-[0%]">
							Schedule
						</p>
					</NavbarLink>
					<NavbarLink closeCallback={closeCallback} href="/admin/users">
						<User1Line className="h-5 w-5" />
						<p className="whitespace-nowrap align-middle font-medium text-[14px] text-grey800 leading-5 tracking-[0%]">
							Registered Users
						</p>
					</NavbarLink>
					<NavbarLink closeCallback={closeCallback} href="/admin/teams">
						<Group3Line className="h-5 w-5" />
						<p className="whitespace-nowrap align-middle font-medium text-[14px] text-grey800 leading-5 tracking-[0%]">
							Teams
						</p>
					</NavbarLink>
					<NavbarLink closeCallback={closeCallback} href="/admin/meals">
						<HamburgerLine className="h-5 w-5" />
						<p className="whitespace-nowrap align-middle font-medium text-[14px] text-grey800 leading-5 tracking-[0%]">
							Meals
						</p>
					</NavbarLink>
					<NavbarLink closeCallback={closeCallback} href="/admin/judge">
						<TaskLine className="h-5 w-5" />
						<p className="whitespace-nowrap align-middle font-medium text-[14px] text-grey800 leading-5 tracking-[0%]">
							Judging Information
						</p>
					</NavbarLink>
				</div>
				<NavbarDivider />
				<div className="flex flex-col gap-5">
					<NavbarTitle text="APP MANAGEMENT" />
					<NavbarLink closeCallback={closeCallback} href="/admin/reset">
						<TaskLine className="h-5 w-5" />
						<p className="whitespace-nowrap align-middle font-medium text-[14px] text-grey800 leading-5 tracking-[0%]">
							Admin Controls
						</p>
					</NavbarLink>
				</div>
			</div>
		</div>
	);
}

export default function AdminNavbar({ user }: { user: User }) {
	const [navbarOpen, setNavbarOpen] = useState(false);

	const closeNavbar = useCallback(() => setNavbarOpen(false), []);

	const toggleNavbar = useCallback(() => {
		setNavbarOpen(!navbarOpen);
	}, [navbarOpen]);

	const topBarRef = useRef<HTMLDivElement>(null);
	const linksRef = useRef<HTMLDivElement>(null);
	useEffect(() => {
		const handleClickOutside = (e: MouseEvent) => {
			if (
				topBarRef.current &&
				linksRef.current &&
				!topBarRef.current.contains(e.target as Node) &&
				!linksRef.current.contains(e.target as Node)
			) {
				closeNavbar();
			}
		};

		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				closeNavbar();
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		document.addEventListener("keydown", handleKeyDown);

		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
			document.removeEventListener("keydown", handleKeyDown);
		};
	}, [closeNavbar]);

	return (
		<>
			<div className="sticky top-0 z-999 lg:hidden">
				{/* Bar at the top when in mobile/tablet size */}
				<div
					className="sticky flex flex-row justify-between bg-white px-6 py-1"
					ref={topBarRef}
				>
					<MenuLine className="h-11 w-11 p-3" onClick={toggleNavbar} />
					<NotificationLine className="h-11 w-11 p-3" />
				</div>
				{navbarOpen && (
					<div className="fixed top-13 z-999 h-full w-screen bg-[rgba(0,0,0,0.25)]">
						<NavbarLinks
							className="flex lg:hidden"
							closeCallback={closeNavbar}
							ref={linksRef}
							user={user}
						/>
					</div>
				)}
			</div>
			<NavbarLinks
				className="hidden lg:flex"
				closeCallback={closeNavbar}
				user={user}
			/>
		</>
	);
}
