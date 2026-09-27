"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/app/components/ui/button";
import { DASHBOARD_HREFS } from "@/lib/constants";
import { authClient } from "@/server/better-auth/client";
import { Role } from "@/types/types";
import Countdown from "./Countdown";

const EVENT_NAME = "Hack the Change";
const EVENT_YEAR = "2026";
const EVENT_BLURB =
	"Hack the Change is a hybrid two-day for-charity hackathon with the mission of coding a better world together.";
const BG_IMAGE = "/svgs/landingPage/countdown_bg.svg";
const CTA_BUTTON_STYLES =
	"h-15 w-40 rounded-3xl border-5 border-white bg-awesomer-purple font-semibold text-white transition-opacity hover:bg-awesomer-purple hover:opacity-70";

export default function Hero() {
	const { data: session } = authClient.useSession();
	const isSignedIn = !!session?.user;
	const dashboardHref =
		DASHBOARD_HREFS[session?.user.role as Role] ??
		DASHBOARD_HREFS[Role.PARTICIPANT];

	return (
		<section className="relative mt-16 w-full overflow-x-hidden px-4 sm:px-12 md:mt-22 lg:px-24">
			<Image
				alt=""
				className="pointer-events-none object-cover"
				fill
				priority
				src={BG_IMAGE}
			/>

			<div className="relative flex w-full flex-col items-center gap-8 overflow-hidden pt-30 pb-20 text-center md:pt-34 lg:pt-28">
				<div className="flex w-full flex-col items-center gap-4">
					<h1 className="font-bold text-4xl text-outline-purple text-white sm:text-5xl md:text-6xl lg:text-7xl">
						{EVENT_NAME} <span className="text-pastel-green">{EVENT_YEAR}</span>
					</h1>

					<p className="max-w-lg font-medium text-lg text-primary leading-7 sm:max-w-xl md:max-w-2xl md:text-2xl md:leading-10 lg:max-w-200 lg:text-3xl">
						{EVENT_BLURB}
					</p>
				</div>
				{isSignedIn && (
					<Button
						className={CTA_BUTTON_STYLES}
						nativeButton={false}
						render={<Link href={dashboardHref}>Dashboard</Link>}
					/>
				)}
				{!isSignedIn && (
					<div className="flex flex-col items-center gap-4">
						<Button
							className={CTA_BUTTON_STYLES}
							nativeButton={false}
							render={<Link href="/signup">Join Hackathon</Link>}
						/>

						<p className="font-medium text-base text-dark-grey sm:text-xl">
							Already registered?{" "}
							<Link
								className="font-semibold text-awesomer-purple! hover:opacity-70"
								href="/login"
							>
								Sign in
							</Link>
						</p>
					</div>
				)}
			</div>

			<div className="relative">
				<Countdown />
			</div>
		</section>
	);
}
