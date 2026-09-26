"use client";

import Link from "next/link";
import { authClient } from "@/server/better-auth/client";

const EVENT_NAME = "Hack the Change";
const EVENT_YEAR = "2026";
const EVENT_BLURB =
	"Hack the Change 2026 is a hybrid two-day for-charity hackathon with the mission of coding a better world together.";

export default function CountdownHero() {
	const { data: session } = authClient.useSession();
	const isSignedIn = !!session?.user;
	return (
		<div className="relative flex w-full flex-col items-center gap-4 overflow-hidden text-center">
			<h1 className="font-bold text-4xl text-white [text-shadow:_-2px_-2px_0_#7055FD,_2px_-2px_0_#7055FD,_-2px_2px_0_#7055FD,_2px_2px_0_#7055FD] sm:text-6xl lg:text-7xl">
				{EVENT_NAME}{" "}
				<span className="text-pastel-green [text-shadow:-2px_-2px_0_#7055FD,2px_-2px_0_#7055FD,-2px_2px_0_#7055FD,2px_2px_0_#7055FD]">
					{EVENT_YEAR}
				</span>
			</h1>

			<p className="max-w-xs font-semibold text-awesomer-purple text-lg leading-7 sm:max-w-4xl sm:text-3xl sm:leading-10">
				{EVENT_BLURB}
			</p>
			{!isSignedIn && (
				<>
					<Link
						className="flex h-15 w-40 items-center justify-center rounded-3xl border-5 border-white bg-awesomer-purple transition-opacity hover:opacity-70"
						href="/signup"
					>
						<p className="font-semibold text-white">Register Now</p>
					</Link>

					<p className="font-medium text-base text-dark-grey sm:text-xl">
						Already registered?{" "}
						<Link
							className="font-semibold text-awesomer-purple! hover:opacity-70"
							href="/login"
						>
							Sign in
						</Link>
					</p>
				</>
			)}
		</div>
	);
}
