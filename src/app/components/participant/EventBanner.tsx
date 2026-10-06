import { Alarm1Line, ArrowRightLine, LocationLine } from "@mingcute/react";
import Image from "next/image";
import { buttonVariants } from "@/app/components/ui/button";
import {
	type DashboardEvent,
	eventNavigationUrlSchema
} from "@/lib/participant-events";
import { cn } from "@/lib/utils";

export function EventBanner({
	event,
	timeZone
}: {
	event?: DashboardEvent;
	timeZone: string;
}) {
	const isPlaceholder = !event;
	const format = new Intl.DateTimeFormat("en-US", {
		hour: "numeric",
		minute: "2-digit",
		timeZone
	});
	const href = event
		? eventNavigationUrlSchema.safeParse(event.navigationUrl)
		: { success: false as const };
	return (
		<section
			aria-label="Current event"
			className="relative isolate flex min-h-75 flex-col items-start justify-between gap-6 overflow-hidden rounded-2xl bg-red-700 p-6 text-white sm:min-h-44 sm:flex-row"
		>
			<div className="relative z-10 flex w-full flex-col gap-4 sm:max-w-100 sm:bg-red-700">
				<div className="flex flex-col gap-1">
					<h2 className="wrap-break-word font-semibold text-[28px]/9">
						{isPlaceholder
							? "Hackathon updates coming soon"
							: `${event.title} ongoing now!`}
					</h2>
					{event ? (
						<div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
							<span className="flex items-center gap-2">
								<LocationLine aria-hidden className="size-6 shrink-0" />
								{event.location || "Location to be announced"}
							</span>
							<span className="flex items-center gap-2">
								<Alarm1Line aria-hidden className="size-6 shrink-0" />
								{format.format(event.startTime)} –{" "}
								{format.format(event.endTime)}
							</span>
						</div>
					) : (
						<p className="text-base/6">
							We’re getting the next event ready. Check back soon for schedule
							details.
						</p>
					)}
				</div>
				{event && (
					<p className="wrap-break-word text-base/6">{event.description}</p>
				)}
			</div>
			<div
				aria-hidden
				className="pointer-events-none absolute right-0 bottom-[-25px] h-46 w-80 sm:top-[-76px] sm:right-auto sm:bottom-auto sm:left-[427px] sm:h-84 sm:w-135"
			>
				<Image
					alt=""
					className="absolute top-0 left-0 size-48 rotate-[-4deg] sm:size-[314px]"
					height={314}
					loading="eager"
					src="/images/participant-shared/trophy.png"
					width={314}
				/>
				<Image
					alt=""
					className="absolute top-5 right-0 size-40 rotate-[9deg] sm:top-10 sm:size-65"
					height={260}
					src="/images/participant-shared/gift.png"
					width={260}
				/>
			</div>
			{href.success && (
				<a
					className={cn(
						buttonVariants({
							className:
								"rounded-xl bg-red-50 text-red-900 shadow-elevation-200 hover:bg-red-200"
						}),
						"relative z-10 mt-12 sm:mt-0"
					)}
					href={href.data}
				>
					Navigate there
					<ArrowRightLine data-icon="inline-end" />
				</a>
			)}
		</section>
	);
}
