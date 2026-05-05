"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
	{ href: "/judge", label: "Dashboard" },
	{ href: "/judge/schedule", label: "Schedule" },
	{ href: "/judge/rubric", label: "Rubric" }
] as const;

export default function JudgeNav() {
	const pathname = usePathname();

	return (
		<nav className="border-medium-grey border-b bg-white px-4 py-3 sm:px-8">
			<ul className="mx-auto flex max-w-6xl list-none flex-wrap justify-center gap-8">
				{links.map(({ href, label }) => {
					// Dashboard is exact-match, the other tabs can stay active for child pages.
					const isActive =
						href === "/judge"
							? pathname === "/judge" || pathname === "/judge/"
							: pathname === href || pathname.startsWith(`${href}/`);

					return (
						<li key={href}>
							<Link
								className={
									isActive
										? "font-bold text-awesomer-purple"
										: "font-medium text-awesomer-purple/80 hover:text-awesomer-purple"
								}
								href={href}
							>
								{label}
							</Link>
						</li>
					);
				})}
			</ul>
		</nav>
	);
}
