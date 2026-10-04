"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { DASHBOARD_HREFS } from "@/lib/constants";
import { authClient } from "@/server/better-auth/client";
import { Role } from "@/types/types";

export default function Header() {
	const router = useRouter();
	const pathname = usePathname();
	const { data: session } = authClient.useSession();
	const isSignedIn = !!session?.user;
	const dashboardHref =
		DASHBOARD_HREFS[session?.user.role as Role] ??
		DASHBOARD_HREFS[Role.PARTICIPANT];

	const LINK_STYLES =
		"font-semibold text-awesomer-purple! text-lg sm:text-xl transition-colors hover:text-awesome-purple!";

	const handleSignOut = async () => {
		const { error } = await authClient.signOut();

		if (error) {
			console.error("Error signing out:", error);
			return;
		}

		router.push("/");
		router.refresh();
	};

	// Already on the landing page, so the logo takes you back to the top.
	const handleLogoClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
		if (pathname !== "/") return;
		event.preventDefault();
		const reduceMotion = window.matchMedia(
			"(prefers-reduced-motion: reduce)"
		).matches;
		window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
	};

	return (
		<header className="fixed inset-x-0 top-0 z-10 flex h-16 w-full items-center justify-between bg-white px-6 py-6 md:h-22 md:px-16 md:py-8">
			<div className="text-center">
				{!isSignedIn && (
					<Link className={LINK_STYLES} href="/signup">
						<span className="hidden sm:block">Join Hackathon</span>
						<span className="sm:hidden">Join</span>
					</Link>
				)}
				{isSignedIn && (
					<Link className={LINK_STYLES} href={dashboardHref}>
						Dashboard
					</Link>
				)}
			</div>

			<Link
				className="-translate-x-1/2 absolute left-1/2 rounded-lg"
				href="/"
				onClick={handleLogoClick}
			>
				<Image
					alt="Code the Change YYC home"
					className="block size-10 md:size-14"
					height={70}
					src="/svgs/CTCLogo.svg"
					width={70}
				/>
			</Link>

			<div className="flex min-w-25 justify-end">
				{!isSignedIn && (
					<Link className={LINK_STYLES} href="/login">
						Log in
					</Link>
				)}
				{isSignedIn && (
					<button
						className={`cursor-pointer ${LINK_STYLES}`}
						onClick={handleSignOut}
						type="button"
					>
						Log out
					</button>
				)}
			</div>
		</header>
	);
}
