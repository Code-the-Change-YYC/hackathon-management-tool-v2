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
	timeZone,
	tone = "red"
}: {
	event?: DashboardEvent;
	timeZone: string;
	tone?: "red" | "purple";
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
			className={cn(
				"relative isolate flex min-h-75 flex-col items-start justify-between gap-6 overflow-hidden rounded-2xl p-6 text-white sm:min-h-44 sm:flex-row",
				tone === "purple" ? "min-h-[299px] bg-purple-500" : "bg-red-700"
			)}
		>
			<div
				className={cn(
					"relative z-10 flex w-full flex-col gap-4 sm:max-w-100",
					tone === "purple" ? "rounded-lg bg-purple-500" : "sm:bg-red-700"
				)}
			>
				<div className="flex flex-col gap-1">
					<h2 className="wrap-break-word font-semibold text-[28px]/9">
						{isPlaceholder
							? "Hackathon updates coming soon"
							: `${event.title} ongoing now!`}
					</h2>
					{event ? (
						<div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
							<span className="flex items-center gap-2">
								{tone === "purple" ? (
									<Image
										alt=""
										height={24.8}
										src="/images/participant-shared/banner-location.svg"
										width={24.1429}
									/>
								) : (
									<LocationLine aria-hidden className="size-6 shrink-0" />
								)}
								{event.location || "Location to be announced"}
							</span>
							<span className="flex items-center gap-2">
								{tone === "purple" ? (
									<Image
										alt=""
										height={24.8}
										src="/images/participant-shared/banner-time.svg"
										width={24.1429}
									/>
								) : (
									<Alarm1Line aria-hidden className="size-6 shrink-0" />
								)}
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
				className={cn(
					"pointer-events-none absolute sm:top-[-76px] sm:right-auto sm:bottom-auto sm:left-[427px]",
					tone === "purple"
						? "bottom-[-34.2px] left-[20.75px] h-[216.29px] w-[350.54px] sm:h-[334.598px] sm:w-[539.482px]"
						: "right-0 bottom-[-25px] h-46 w-80 sm:h-84 sm:w-135"
				)}
			>
				<Image
					alt=""
					className={cn(
						"absolute",
						tone === "purple"
							? "top-[6.479px] left-[6.479px] size-[195.274px] rotate-[-3.94deg] sm:top-[10.411px] sm:left-[10.411px] sm:size-[313.777px]"
							: "top-0 left-0 size-48 rotate-[-4deg] sm:size-[314px]"
					)}
					height={314}
					src="/images/participant-shared/trophy.png"
					width={314}
				/>
				<Image
					alt=""
					className={cn(
						"absolute",
						tone === "purple"
							? "top-[42.787px] left-[177.037px] size-[161.881px] rotate-[8.97deg] sm:top-[56.682px] sm:left-[260.682px] sm:size-[260.118px]"
							: "top-5 right-0 size-40 rotate-[9deg] sm:top-10 sm:size-65"
					)}
					height={260}
					src="/images/participant-shared/gift.png"
					width={260}
				/>
			</div>
			{href.success && (
				<a
					className={cn(
						buttonVariants({
							variant: tone === "purple" ? "event-purple" : "event"
						}),
						"relative z-10 mt-12 sm:mt-0"
					)}
					href={href.data}
				>
					Navigate there
					{tone === "purple" ? (
						<Image
							alt=""
							height={20}
							src="/images/participant-shared/arrow.svg"
							width={20}
						/>
					) : (
						<ArrowRightLine data-icon="inline-end" />
					)}
				</a>
			)}
		</section>
	);
}
