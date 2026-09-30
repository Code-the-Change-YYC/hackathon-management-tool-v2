"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DASHBOARD_HREFS } from "@/lib/constants";
import { authClient } from "@/server/better-auth/client";
import { Role } from "@/types/types";

export default function Header() {
	const router = useRouter();
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

			<div className="-translate-x-1/2 absolute left-1/2">
				<Image
					alt="CTC logo"
					className="size-10 md:size-14"
					height={70}
					src="/svgs/CTCLogo.svg"
					width={70}
				/>
			</div>

			<div className="flex min-w-25 justify-end">
				{!isSignedIn && (
					<Link className={LINK_STYLES} href="/login">
						Sign In
					</Link>
				)}
				{isSignedIn && (
					<button
						className={`cursor-pointer ${LINK_STYLES}`}
						onClick={handleSignOut}
						type="button"
					>
						Sign Out
					</button>
				)}
			</div>
		</header>
	);
}
