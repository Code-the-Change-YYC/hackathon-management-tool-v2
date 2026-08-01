import {
	AnnouncementLine,
	HamburgerLine,
	LaptopLine,
	TrophyLine
} from "@mingcute/react";

const timeFormatter = new Intl.DateTimeFormat("en-US", {
	hour: "numeric",
	minute: "2-digit"
});

export type ScheduleItemData = {
	id: string;
	title: string;
	startTime: Date;
	endTime: Date;
	badgeLabel: string;
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

function getScheduleItemTheme(badgeLabel: string): ScheduleItemTheme {
	switch (badgeLabel.trim().toLowerCase()) {
		case "food":
			return {
				badgeClassName: "bg-dark-pink",
				lineClassName: "bg-medium-pink",
				previewClassName: "bg-pastel-pink",
				iconColor: "var(--color-dark-pink)"
			};
		case "ceremony":
			return {
				badgeClassName: "bg-awesomer-purple",
				lineClassName: "bg-awesome-purple",
				previewClassName: "bg-lilac-purple",
				iconColor: "var(--color-awesomer-purple)"
			};
		case "project":
			return {
				badgeClassName: "bg-grapefruit",
				lineClassName: "bg-grapefruit",
				previewClassName: "bg-fuzzy-peach",
				iconColor: "var(--color-grapefruit)"
			};
		case "activity":
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

function getScheduleItemIcon(badgeLabel: string, color: string) {
	switch (badgeLabel.trim().toLowerCase()) {
		case "food":
			return <HamburgerLine className="size-full" color={color} />;
		case "activity":
			return <TrophyLine className="size-full" color={color} />;
		case "project":
			return <LaptopLine className="size-full" color={color} />;
		case "ceremony":
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
		getScheduleItemTheme(item.badgeLabel);
	const icon = getScheduleItemIcon(item.badgeLabel, iconColor);

	return (
		<li className="flex items-stretch gap-2">
			<div className="flex w-14 shrink-0 flex-col items-end text-right">
				<span
					className={`rounded-full px-2 py-0.5 font-bold text-[10px] text-white ${badgeClassName}`}
				>
					{item.badgeLabel}
				</span>
				<span className="mt-2 text-[10px] text-dark-grey/70 leading-3">
					{status}
				</span>
			</div>

			<div
				aria-hidden="true"
				className={`w-px shrink-0 self-stretch ${lineClassName}`}
			/>

			<div className="flex min-w-0 flex-1 flex-col gap-4 md:flex-row md:items-start">
				<div
					aria-hidden="true"
					className={`flex size-20 shrink-0 items-center justify-center rounded-md p-5 md:size-24 ${previewClassName}`}
				>
					{icon}
				</div>

				<div className="min-w-0 space-y-2">
					<h4 className="wrap-break-word font-semibold text-base text-dark-grey">
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
