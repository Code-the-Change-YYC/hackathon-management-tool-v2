import { ArrowRightLine } from "@mingcute/react";
import Image from "next/image";
import { Button } from "@/app/components/ui/button";

export function ReleaseScoresBanner() {
	return (
		<section className="relative flex min-h-74.75 flex-col overflow-hidden rounded-2xl bg-primary p-6 text-primary-foreground sm:block sm:min-h-37">
			<div className="relative z-10 max-w-100">
				<h2 className="m-0 font-semibold text-[28px] leading-9">
					Release Scores to Teams
				</h2>
				<p className="mt-4 mb-0 max-w-100 text-base leading-6">
					Let participants know how they scored in their projects now that the
					hackathon has ended!
				</p>
			</div>

			<div className="-bottom-8.5 sm:-top-17.5 pointer-events-none absolute inset-x-0 h-43.5 sm:inset-auto sm:right-0 sm:h-65 sm:w-130">
				<Image
					alt=""
					className="-rotate-[4deg] -bottom-2 absolute left-0 h-41.25 w-41.25 object-contain sm:top-0 sm:left-0 sm:h-62.5 sm:w-62.5"
					height={250}
					src="/images/admin-judging/gift.png"
					width={250}
				/>
				<Image
					alt=""
					className="-right-4 -bottom-2 absolute h-38.75 w-38.75 rotate-[9deg] object-contain sm:top-8 sm:right-2 sm:h-57.5 sm:w-57.5"
					height={230}
					src="/images/admin-judging/trophy.png"
					width={230}
				/>
			</div>

			<Button
				className="absolute bottom-4 left-4 z-20 sm:top-5 sm:right-5 sm:bottom-auto sm:left-auto"
				disabled
				title="Score release is not wired yet."
				type="button"
				variant="secondary"
			>
				Release scores
				<ArrowRightLine data-icon="inline-end" />
			</Button>
		</section>
	);
}
