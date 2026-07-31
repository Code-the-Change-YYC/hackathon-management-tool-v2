"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/server/better-auth/client";
import type { HeaderProps } from "@/types/landingPage";

export default function Header({ hasTeam }: HeaderProps) {
	const router = useRouter();
	const { data: session } = authClient.useSession();
	const isSignedIn = !!session?.user;

	const handleSignOut = async () => {
		await authClient.signOut();
		router.push("/");
		router.refresh();
	};

	return (
		<header className="relative w-full bg-white shadow-[0_4px_4px_0_rgba(0,0,0,0.25)]">
			<div className="flex items-center justify-between px-22 py-10">
				<div className="min-w-25">
					{!isSignedIn && (
						<Link
							className="font-semibold text-2xl text-awesomer-purple! transition-colors hover:text-awesome-purple!"
							href="/register"
						>
							Join Hackathon
						</Link>
					)}
					{isSignedIn && !hasTeam && (
						<Link
							className="font-semibold text-2xl text-awesomer-purple! transition-colors hover:text-awesome-purple!"
							href="/teams"
						>
							Join a Team
						</Link>
					)}
				</div>

				<div className="-translate-x-1/2 absolute left-1/2">
					<Image
						alt="CTC logo"
						height={70}
						src="/svgs/CTCLogo.svg"
						width={70}
					/>
				</div>

				<div className="flex min-w-25 justify-end">
					{!isSignedIn && (
						<Link
							className="font-semibold text-2xl text-awesomer-purple! transition-colors hover:text-awesome-purple!"
							href="/login"
						>
							Sign In
						</Link>
					)}
					{isSignedIn && (
						<button
							className="cursor-pointer font-semibold text-2xl text-awesomer-purple! transition-colors hover:text-awesome-purple!"
							onClick={handleSignOut}
							type="button"
						>
							Sign Out
						</button>
					)}
				</div>
			</div>
		</header>
	);
}
