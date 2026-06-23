"use client";

import Image from "next/image";
import { ArrowRightIcon } from "@/app/components/layout/icons";

export default function NoTeamBanner({ onAction }: { onAction: () => void }) {
	return (
		<div className="relative overflow-hidden rounded-[16px] bg-red-700">
			<div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
				<div className="flex flex-col gap-2">
					<h2 className="font-semibold text-[28px] text-white leading-9">
						You aren't part of a team yet!
					</h2>
					<p className="max-w-xl text-[16px] text-white/90 leading-6">
						Form a team of 2-5 members (including yourself!) and register or
						join your team!
					</p>
				</div>

				<button
					className="flex shrink-0 items-center gap-2 self-start rounded-full bg-grey-00 px-5 py-3 font-medium text-[16px] text-red-900 transition hover:bg-white/90 sm:self-auto"
					onClick={onAction}
					type="button"
				>
					Join or register a team
					<ArrowRightIcon className="size-5" />
				</button>
			</div>

			<Image
				alt=""
				aria-hidden="true"
				className="pointer-events-none absolute top-0 right-40 hidden h-full w-auto object-cover opacity-90 xl:block"
				height={160}
				src="/team/mascot-join.png"
				width={220}
			/>
		</div>
	);
}
