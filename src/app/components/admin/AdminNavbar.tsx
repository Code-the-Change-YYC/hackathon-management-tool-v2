import type { StaticImport } from "next/dist/shared/lib/get-img-props";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import calendar_icon from "public/svgs/admin/calendar_icon.svg";
import clipboard_icon from "public/svgs/admin/clipboard_icon.svg";
import food_icon from "public/svgs/admin/food_icon.svg";
import team_icon from "public/svgs/admin/team_icon.svg";
import user_icon from "public/svgs/admin/user_icon.svg";
import bell_icon from "public/svgs/navbar/bell_icon.svg";
import hamburger_icon from "public/svgs/navbar/hamburger_icon.svg";
import { type Ref, useCallback, useEffect, useRef, useState } from "react";
import { twMerge } from "tailwind-merge";

function NavbarTitle({ text }: { text: string }) {
	return (
		<p className="font-medium text-[#575757] text-[11px] leading-[16px]">
			{text}
		</p>
	);
}

function NavbarLink({
	icon,
	children,
	href,
	closeCallback = () => {}
}: {
	icon: string | StaticImport;
	children: React.ReactNode;
	href: string;
	closeCallback?: () => void;
}) {
	const pathName = usePathname();

	return (
		<Link
			className={twMerge(
				"flex flex-row items-center gap-[4px] rounded-[12px] px-[12px] py-[6px]",
				pathName === href ? "bg-[#EAE6FF] mix-blend-multiply" : ""
			)}
			href={href}
			onClick={closeCallback}
		>
			<div className="h-[20px] w-[20px]">
				<Image
					alt="Navbar Icon"
					className="h-full w-full"
					height={20}
					src={icon}
					width={20}
				/>
			</div>
			<p className="whitespace-nowrap align-middle font-medium text-[#292929] text-[14px] leading-[20px] tracking-[0%]">
				{children}
			</p>
		</Link>
	);
}

function NavbarDivider() {
	return <div className="h-[1px] w-full rounded-full bg-[#D6D6D6]" />;
}

function NavbarLinks({
	ref,
	className = "",
	closeCallback
}: {
	ref?: Ref<HTMLDivElement>;
	className?: string;
	closeCallback: () => void;
}) {
	return (
		<div
			className={twMerge(
				"h-screen w-[209px] flex-col gap-[20px] bg-white py-[16px] pr-[8px] pl-[16px]",
				className
			)}
			ref={ref}
		>
			<div className="flex flex-row items-center justify-between">
				<div className="flex h-full flex-row items-center gap-[8px]">
					<div className="h-[28px] w-[28px] rounded-full bg-red-300" />
					<p className="font-medium text-[16px] leading-[24px]">Victoria</p>
				</div>
				<div className="h-[48px] w-[48px] p-[12px]">
					<Image
						alt="notifications"
						className="h-full w-full"
						height={20}
						src={bell_icon}
						width={20}
					/>
				</div>
			</div>
			<div className="flex flex-col gap-[20px] pr-[8px]">
				<div className="flex flex-col gap-[16px]">
					<NavbarTitle text="EVENT MANAGEMENT" />

					<NavbarLink
						closeCallback={closeCallback}
						href="/admin/schedule"
						icon={calendar_icon}
					>
						Schedule
					</NavbarLink>
					<NavbarLink
						closeCallback={closeCallback}
						href="/admin/users"
						icon={user_icon}
					>
						Registered Users
					</NavbarLink>
					<NavbarLink
						closeCallback={closeCallback}
						href="/admin/teams"
						icon={team_icon}
					>
						Teams
					</NavbarLink>
					<NavbarLink
						closeCallback={closeCallback}
						href="/admin/meals"
						icon={food_icon}
					>
						Meals
					</NavbarLink>
					<NavbarLink
						closeCallback={closeCallback}
						href=""
						icon={clipboard_icon}
					>
						Judging Information
					</NavbarLink>
				</div>
				<NavbarDivider />
				<div className="flex flex-col gap-[20px]">
					<NavbarTitle text="APP MANAGEMENT" />
					<NavbarLink
						closeCallback={closeCallback}
						href="/admin/reset"
						icon={clipboard_icon}
					>
						Admin Controls
					</NavbarLink>
				</div>
			</div>
		</div>
	);
}

export default function AdminNavbar() {
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
					className="flex flex-row justify-between bg-white px-[24px] py-[4px]"
					ref={topBarRef}
				>
					<button
						className="h-[44px] w-[44px] p-[12px]"
						onClick={toggleNavbar}
						type="button"
					>
						<Image
							alt="Add icon"
							className="h-full w-full"
							height={20}
							src={hamburger_icon}
							width={20}
						/>
					</button>
					<div className="h-[44px] w-[44px] p-[12px]">
						<Image
							alt="Add icon"
							className="h-full w-full"
							height={20}
							src={bell_icon}
							width={20}
						/>
					</div>
				</div>
				{navbarOpen && (
					<div className="fixed inset-0 bg-[rgba(0,0,0,0.25)]">
						<NavbarLinks closeCallback={closeNavbar} ref={linksRef} />
					</div>
				)}
			</div>
			<NavbarLinks className="hidden lg:flex" closeCallback={closeNavbar} />
		</>
	);
}
