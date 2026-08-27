"use client";

// Banner shown on My Team when the user isn't on a team yet, prompting them
// to register or join one.

import Image from "next/image";
import { ArrowRightIcon } from "@/app/components/layout/icons";
import { Button } from "@/app/components/ui/button";

export default function NoTeamBanner({ onAction }: { onAction: () => void }) {
	return (
		<div className="relative overflow-hidden rounded-[16px] bg-red-700">
			<div
				aria-hidden="true"
				className="pointer-events-none absolute inset-y-0 right-40 hidden items-end lg:flex"
			>
				<Image
					alt=""
					className="h-full w-auto object-contain"
					height={160}
					src="/team/mascot-celebrate.png"
					width={180}
				/>
				<Image
					alt=""
					className="-ml-8 h-full w-auto object-contain"
					height={160}
					src="/team/mascot-flag.png"
					width={160}
				/>
			</div>

			<div className="relative flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
				<div className="flex flex-col gap-2">
					<h2 className="font-semibold text-[28px] text-white leading-9">
						You aren't part of a team yet!
					</h2>
					<p className="max-w-xl text-[16px] text-white/90 leading-6">
						Form a team of 2-5 members (including yourself!) and register or
						join your team!
					</p>
				</div>

				<Button
					className="self-start rounded-full bg-white px-5 py-3 text-[16px] text-red-900 hover:bg-white/90 sm:self-auto"
					onClick={onAction}
					type="button"
				>
					Join or register a team
					<ArrowRightIcon className="size-5" />
				</Button>
			</div>
		</div>
	);
}
