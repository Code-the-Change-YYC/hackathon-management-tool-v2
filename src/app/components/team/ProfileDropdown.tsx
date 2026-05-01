"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { authClient } from "@/server/better-auth/client";

interface ProfileDropdownProps {
	userName?: string;
}

export default function ProfileDropdown({ userName }: ProfileDropdownProps) {
	const router = useRouter();
	const detailsRef = useRef<HTMLDetailsElement>(null);

	// Close dropdown when clicking outside
	useEffect(() => {
		function handleClick(e: MouseEvent) {
			if (
				detailsRef.current &&
				!detailsRef.current.contains(e.target as Node)
			) {
				detailsRef.current.open = false;
			}
		}
		document.addEventListener("click", handleClick);
		return () => document.removeEventListener("click", handleClick);
	}, []);

	async function handleSignOut() {
		await authClient.signOut();
		router.push("/login");
	}

	return (
		<details className="relative" ref={detailsRef}>
			<summary className="no-details-marker flex cursor-pointer list-none items-center justify-center">
				{/* Profile avatar circle */}
				<span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-medium-grey text-dark-grey transition hover:opacity-80 sm:h-10 sm:w-10">
					<svg
						aria-label="Profile menu"
						fill="currentColor"
						height="28"
						role="img"
						viewBox="0 0 24 24"
						width="28"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
					</svg>
				</span>
			</summary>

			{/* Dropdown panel */}
			<div className="absolute top-full right-0 z-50 mt-2 min-w-[200px] overflow-hidden rounded-xl bg-awesomer-purple shadow-xl">
				{/* User header */}
				<div className="flex items-center gap-3 bg-awesomer-purple px-5 py-4">
					<span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-medium-grey text-dark-grey">
						<svg
							aria-hidden="true"
							fill="currentColor"
							height="24"
							viewBox="0 0 24 24"
							width="24"
							xmlns="http://www.w3.org/2000/svg"
						>
							<path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
						</svg>
					</span>
					<span className="font-bold text-lg text-white">
						{userName ?? "Full Name"}
					</span>
				</div>

				{/* Menu items */}
				<div className="bg-lilac-purple">
					<Link
						className="flex items-center gap-4 px-5 py-4 font-semibold text-dark-grey text-lg transition hover:bg-awesome-purple/20"
						href="/participant"
					>
						<svg
							aria-hidden="true"
							fill="currentColor"
							height="22"
							viewBox="0 0 24 24"
							width="22"
						>
							<path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
						</svg>
						Profile
					</Link>

					<Link
						className="flex items-center gap-4 px-5 py-4 font-semibold text-dark-grey text-lg transition hover:bg-awesome-purple/20"
						href="/meal"
					>
						<svg
							aria-hidden="true"
							fill="currentColor"
							height="22"
							viewBox="0 0 24 24"
							width="22"
						>
							<path d="M21.41 11.58l-9-9A2 2 0 0 0 11 2H4a2 2 0 0 0-2 2v7a2 2 0 0 0 .59 1.42l9 9A2 2 0 0 0 13 22a2 2 0 0 0 1.41-.59l7-7A2 2 0 0 0 22 13a2 2 0 0 0-.59-1.42zM5.5 7C4.67 7 4 6.33 4 5.5S4.67 4 5.5 4 7 4.67 7 5.5 6.33 7 5.5 7z" />
						</svg>
						Food Ticket
					</Link>

					<Link
						className="flex items-center gap-4 px-5 py-4 font-semibold text-dark-grey text-lg transition hover:bg-awesome-purple/20"
						href="/team"
					>
						<svg
							aria-hidden="true"
							fill="currentColor"
							height="22"
							viewBox="0 0 24 24"
							width="22"
						>
							<path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
						</svg>
						Team Details
					</Link>

					<hr className="border-awesome-purple/30" />

					<button
						className="flex w-full items-center gap-4 px-5 py-4 font-semibold text-dark-grey text-lg transition hover:bg-awesome-purple/20"
						onClick={handleSignOut}
						type="button"
					>
						<svg
							aria-hidden="true"
							fill="currentColor"
							height="22"
							viewBox="0 0 24 24"
							width="22"
						>
							<path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5-5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" />
						</svg>
						Log out
					</button>
				</div>
			</div>
		</details>
	);
}
