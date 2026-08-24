import {
	AnnouncementLine,
	HamburgerLine,
	LaptopLine,
	TrophyLine
} from "@mingcute/react";
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

	if (currentTime >= startTime && currentTime <= endTime) {
		return "Ongoing";
	}

	if (currentTime > endTime) {
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

type ScheduleItemProps = {
	item: ScheduleItemData;
	now: Date;
};

export function ScheduleItem({ item, now }: ScheduleItemProps) {
	const status = getScheduleItemStatus(item, now);
	const { badgeClassName, lineClassName, previewClassName, iconColor } =
		getScheduleItemTheme(item.eventType);
	const icon = getScheduleItemIcon(item.eventType, iconColor);
	const badgeLabel =
		item.eventType.charAt(0).toUpperCase() + item.eventType.slice(1);

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
