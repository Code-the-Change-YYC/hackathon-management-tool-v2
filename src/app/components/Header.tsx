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
		const { error } = await authClient.signOut();

		if (error) {
			console.error("Error signing out:", error);
			return;
		}

		router.push("/");
		router.refresh();
	};

	return (
		<header className="relative flex w-full items-center justify-between bg-white px-4 py-10 font-semibold text-awesomer-purple! text-lg shadow-[0_4px_4px_0_rgba(0,0,0,0.25)] sm:px-22 sm:text-2xl">
			<div className="min-w-25 max-w-16 text-center sm:max-w-none">
				{!isSignedIn && (
					<Link
						className="transition-colors hover:text-awesome-purple!"
						href="/register"
					>
						Join Hackathon
					</Link>
				)}
				{isSignedIn && !hasTeam && (
					<Link
						className="transition-colors hover:text-awesome-purple!"
						href="/participant/my-team"
					>
						Join a Team
					</Link>
				)}
			</div>

			<div className="-translate-x-1/2 absolute left-1/2">
				<Image alt="CTC logo" height={70} src="/svgs/CTCLogo.svg" width={70} />
			</div>

			<div className="flex min-w-25 justify-end">
				{!isSignedIn && (
					<Link
						className="transition-colors hover:text-awesome-purple!"
						href="/login"
					>
						Sign In
					</Link>
				)}
				{isSignedIn && (
					<button
						className="cursor-pointer transition-colors hover:text-awesome-purple!"
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
