import {
	Alarm1Line,
	AnnouncementLine,
	HamburgerLine,
	LaptopLine,
	LocationLine,
	TrophyLine
} from "@mingcute/react";
import { Badge } from "@/app/components/ui/badge";
import { cn } from "@/lib/utils";
import { EventType } from "@/types/types";

const timeFormatter = new Intl.DateTimeFormat("en-US", {
	hour: "numeric",
	minute: "2-digit"
});

export type ScheduleItemData = {
	id: string;
	title: string;
	startTime: Date;
	endTime: Date;
	eventType: EventType;
	description: string;
	location?: string | null;
};

type ScheduleItemTheme = {
	badgeClassName: string;
	lineClassName: string;
	previewClassName: string;
	iconColor: string;
};

function formatTimeRange(startTime: Date, endTime: Date) {
	return `${timeFormatter.format(startTime)} - ${timeFormatter.format(endTime)}`;
}

function getScheduleItemTheme(eventType: EventType): ScheduleItemTheme {
	switch (eventType) {
		case EventType.FOOD:
			return {
				badgeClassName: "bg-dark-pink",
				lineClassName: "bg-medium-pink",
				previewClassName: "bg-pastel-pink",
				iconColor: "var(--color-dark-pink)"
			};
		case EventType.CEREMONY:
			return {
				badgeClassName: "bg-awesomer-purple",
				lineClassName: "bg-awesome-purple",
				previewClassName: "bg-lilac-purple",
				iconColor: "var(--color-awesomer-purple)"
			};
		case EventType.PROJECT:
			return {
				badgeClassName: "bg-grapefruit",
				lineClassName: "bg-grapefruit",
				previewClassName: "bg-fuzzy-peach",
				iconColor: "var(--color-grapefruit)"
			};
		case EventType.ACTIVITY:
			return {
				badgeClassName: "bg-emerald-green",
				lineClassName: "bg-dark-green",
				previewClassName: "bg-mint-green",
				iconColor: "var(--color-dark-green)"
			};
		default:
			return {
				badgeClassName: "bg-grey-purple",
				lineClassName: "bg-medium-grey",
				previewClassName: "bg-light-grey",
				iconColor: "var(--color-grey-purple)"
			};
	}
}

function getScheduleItemIcon(eventType: EventType, color: string) {
	switch (eventType) {
		case EventType.FOOD:
			return <HamburgerLine className="size-full" color={color} />;
		case EventType.ACTIVITY:
			return <TrophyLine className="size-full" color={color} />;
		case EventType.PROJECT:
			return <LaptopLine className="size-full" color={color} />;
		case EventType.CEREMONY:
			return <AnnouncementLine className="size-full" color={color} />;
		default:
			return null;
	}
}

export function getScheduleItemStatus(item: ScheduleItemData, now: Date) {
	const startTime = item.startTime.getTime();
	const endTime = item.endTime.getTime();
	const currentTime = now.getTime();

	if (currentTime >= startTime && currentTime < endTime) {
		return "Ongoing";
	}

	if (currentTime >= endTime) {
		return "Completed";
	}

	const minutesUntilStart = Math.max(
		1,
		Math.round((startTime - currentTime) / 60000)
	);

	if (minutesUntilStart <= 60) {
		return `In ${minutesUntilStart} min`;
	}

	return "Scheduled";
}

const timelineThemes = {
	food: {
		preview: "bg-red-50",
		line: "bg-red-500",
		badge: "bg-red-600",
		icon: "var(--color-red-700)"
	},
	activity: {
		preview: "bg-green-50",
		line: "bg-green-400",
		badge: "bg-green-700",
		icon: "var(--color-green-900)"
	},
	ceremony: {
		preview: "bg-purple-50",
		line: "bg-purple-500",
		badge: "bg-purple-500",
		icon: "var(--color-purple-800)"
	},
	project: {
		preview: "bg-event-project-surface",
		line: "bg-orange-400",
		badge: "bg-orange-700",
		icon: "var(--color-orange-700)"
	}
};

function relativeStatus(item: ScheduleItemData, now: Date) {
	const status = getScheduleItemStatus(item, now);
	if (status !== "Scheduled") return status;
	const hours = Math.ceil(
		(item.startTime.getTime() - now.getTime()) / 3_600_000
	);
	return `In ${hours} ${hours === 1 ? "hour" : "hours"}`;
}

type ScheduleItemProps = {
	item: ScheduleItemData;
	now: Date;
	variant?: "default" | "compact" | "timeline";
	timeZone?: string;
};

export function ScheduleItem({
	item,
	now,
	variant = "default",
	timeZone
}: ScheduleItemProps) {
	const timeline = variant === "timeline";
	const status = timeline
		? relativeStatus(item, now)
		: getScheduleItemStatus(item, now);
	const { badgeClassName, lineClassName, previewClassName, iconColor } =
		getScheduleItemTheme(item.eventType);
	const icon = getScheduleItemIcon(item.eventType, iconColor);
	const badgeLabel =
		item.eventType.charAt(0).toUpperCase() + item.eventType.slice(1);

	if (variant !== "default") {
		const formatter = new Intl.DateTimeFormat("en-US", {
			hour: "numeric",
			minute: "2-digit",
			timeZone
		});
		return (
			<li
				aria-current={timeline && status === "Ongoing" ? "true" : undefined}
				className={cn(
					"flex min-w-0 flex-col gap-2 rounded-lg bg-grey-50 px-2 py-4 sm:flex-row sm:items-stretch",
					timeline && status === "Ongoing" && "bg-grey-200"
				)}
			>
				<div
					className={cn(
						"flex shrink-0 items-center gap-2 sm:w-17 sm:flex-col sm:items-end sm:py-1",
						timeline && "py-1"
					)}
				>
					<Badge
						className={cn(
							"h-4 px-2 py-0 text-[11px] text-white",
							timeline
								? timelineThemes[item.eventType].badge
								: {
										food: "bg-red-700",
										activity: "bg-emerald-green",
										project: "bg-grapefruit",
										ceremony: "bg-purple-500"
									}[item.eventType]
						)}
					>
						{badgeLabel}
					</Badge>
					<span className="text-[11px]/4 text-grey-600">{status}</span>
				</div>
				<div
					aria-hidden
					className={cn(
						"h-px w-full shrink-0 sm:h-auto sm:w-px",
						timeline ? timelineThemes[item.eventType].line : lineClassName
					)}
				/>
				<div
					className={cn(
						"flex min-w-0 gap-2",
						timeline ? "flex-1 items-start" : "items-center"
					)}
				>
					<div
						aria-hidden
						className={cn(
							"flex shrink-0 items-center justify-center rounded-lg",
							timeline
								? cn("size-22", timelineThemes[item.eventType].preview)
								: cn(
										"size-14 p-2.5",
										item.eventType === EventType.FOOD
											? "bg-red-50"
											: previewClassName
									)
						)}
					>
						{timeline ? (
							<span className="size-12">
								{getScheduleItemIcon(
									item.eventType,
									timelineThemes[item.eventType].icon
								)}
							</span>
						) : (
							icon
						)}
					</div>
					<div className="flex min-w-0 flex-col">
						{timeline ? (
							<h4
								className={cn(
									"wrap-break-word font-medium text-base/6",
									status === "Ongoing" && "font-semibold"
								)}
							>
								{item.title}
							</h4>
						) : (
							<h3 className="wrap-break-word font-medium text-base/6">
								{item.title}
							</h3>
						)}
						<div className="flex flex-wrap items-center gap-x-3 gap-y-1 py-1 font-medium text-grey-600 text-xs/4">
							<span className="flex items-center gap-1">
								<LocationLine aria-hidden className="size-4 shrink-0" />
								{item.location || "Location TBA"}
							</span>
							<span className="flex items-center gap-1">
								<Alarm1Line aria-hidden className="size-4 shrink-0" />
								{formatter.format(item.startTime)} –{" "}
								{formatter.format(item.endTime)}
							</span>
						</div>
						{timeline && (
							<p className="wrap-break-word mt-2 text-sm/5">
								{item.description}
							</p>
						)}
					</div>
				</div>
			</li>
		);
	}

	return (
		<li className="flex min-w-0 flex-col gap-3 md:flex-row md:items-stretch md:gap-2">
			<div className="flex shrink-0 items-center gap-3 md:w-14 md:flex-col md:items-end md:gap-0 md:text-right">
				<span
					className={`rounded-full px-3 py-0.5 font-medium text-white text-xs md:px-2 md:text-[10px] ${badgeClassName}`}
				>
					{badgeLabel}
				</span>
				<span className="text-dark-grey/70 text-sm md:mt-2 md:text-[10px] md:leading-3">
					{status}
				</span>
			</div>

			<div
				aria-hidden="true"
				className={`h-px w-full shrink-0 md:h-auto md:w-px md:self-stretch ${lineClassName}`}
			/>

			<div className="flex min-w-0 flex-1 items-start gap-3 md:gap-4">
				<div
					aria-hidden="true"
					className={`flex size-20 shrink-0 items-center justify-center rounded-md p-5 md:size-24 ${previewClassName}`}
				>
					{icon}
				</div>

				<div className="flex min-w-0 flex-1 flex-col gap-2">
					<h4 className="wrap-break-word font-medium text-base text-dark-grey">
						{item.title}
					</h4>
					<p className="text-dark-grey/70 text-xs">
						{formatTimeRange(item.startTime, item.endTime)}
					</p>
					<p className="text-dark-grey/70 text-sm leading-6">
						{item.description}
					</p>
				</div>
			</div>
		</li>
	);
}
