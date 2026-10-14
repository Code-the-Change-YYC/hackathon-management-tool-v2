import {
	Alarm1Line,
	AnnouncementLine,
	HamburgerLine,
	LaptopLine,
	LocationLine,
	TrophyLine
} from "@mingcute/react";
import { differenceInMinutes } from "date-fns";
import { Badge } from "@/app/components/ui/badge";
import { formatTime } from "@/lib/datetime";
import { cn } from "@/lib/utils";
import { EventType } from "@/types/types";

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
	previewClassName: string;
	iconColor: string;
};

function getScheduleItemTheme(eventType: EventType): ScheduleItemTheme {
	switch (eventType) {
		case EventType.FOOD:
			return {
				badgeClassName: "bg-dark-pink",
				previewClassName: "bg-pastel-pink",
				iconColor: "var(--color-dark-pink)"
			};
		case EventType.CEREMONY:
			return {
				badgeClassName: "bg-awesomer-purple",
				previewClassName: "bg-lilac-purple",
				iconColor: "var(--color-awesomer-purple)"
			};
		case EventType.PROJECT:
			return {
				badgeClassName: "bg-grapefruit",
				previewClassName: "bg-fuzzy-peach",
				iconColor: "var(--color-grapefruit)"
			};
		case EventType.ACTIVITY:
			return {
				badgeClassName: "bg-emerald-green",
				previewClassName: "bg-mint-green",
				iconColor: "var(--color-dark-green)"
			};
		default:
			return {
				badgeClassName: "bg-grey-purple",
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
	if (now >= item.startTime && now < item.endTime) {
		return "Happening now!";
	}

	if (now >= item.endTime) {
		return "Completed";
	}

	const minutesUntilStart = Math.max(
		1,
		differenceInMinutes(item.startTime, now, { roundingMethod: "round" })
	);

	if (minutesUntilStart <= 60) {
		return `In ${minutesUntilStart} min`;
	}

	return "Scheduled";
}

type ScheduleItemProps = {
	item: ScheduleItemData;
	now: Date;
};

export function ScheduleItem({ item, now }: ScheduleItemProps) {
	const status = getScheduleItemStatus(item, now);
	const { badgeClassName, previewClassName, iconColor } = getScheduleItemTheme(
		item.eventType
	);
	const icon = getScheduleItemIcon(item.eventType, iconColor);
	const eventType =
		item.eventType.charAt(0).toUpperCase() + item.eventType.slice(1);

	const showStatusBadge = status !== "Scheduled" && status !== "Completed";

	return (
		<li className="flex min-w-0 flex-col gap-2.5 rounded-lg sm:flex-row sm:items-stretch sm:gap-2">
			<div className="flex min-w-0 flex-1 items-start gap-4">
				<div
					className={cn(
						"flex size-18 shrink-0 items-center justify-center rounded-lg p-4",
						previewClassName
					)}
					title={eventType}
				>
					{icon}
				</div>

				<div className="flex flex-1 flex-col gap-2">
					<div className="flex flex-col gap-0.5">
						<h4 className="wrap-break-word font-medium text-base">
							{item.title}
						</h4>
						<div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-medium text-muted-foreground text-xs/4">
							<span className="flex items-center gap-1">
								<LocationLine aria-hidden className="size-4 shrink-0" />
								{item.location || "Location TBA"}
							</span>
							<span className="flex items-center gap-2">
								<span className="flex items-center gap-1">
									<Alarm1Line aria-hidden className="size-4 shrink-0" />
									{formatTime(item.startTime)} – {formatTime(item.endTime)}
								</span>
							</span>
							{showStatusBadge && (
								<Badge className={cn("px-2 py-0 text-[11px]", badgeClassName)}>
									{status}
								</Badge>
							)}
						</div>
					</div>
					<p className="text-muted-foreground text-xs">{item.description}</p>
				</div>
			</div>
		</li>
	);
}
