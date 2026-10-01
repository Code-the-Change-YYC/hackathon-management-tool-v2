import { cn } from "@/lib/utils";
import { ScheduleItem, type ScheduleItemData } from "./ScheduleItem";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "./ui/empty";

export type ScheduleGroup = {
	key: string;
	label: string;
	items: ScheduleItemData[];
};

function formatDateKey(date: Date, timeZone?: string) {
	return new Intl.DateTimeFormat("en-CA", {
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		timeZone
	}).format(date);
}

export function groupScheduleItemsByDate(
	items: ScheduleItemData[],
	timeZone?: string,
	ordinal = false
) {
	const dateFormatter = new Intl.DateTimeFormat("en-US", {
		weekday: "long",
		month: "long",
		day: "numeric",
		timeZone
	});
	return [...items]
		.sort(
			(a, b) =>
				a.startTime.getTime() - b.startTime.getTime() ||
				a.id.localeCompare(b.id)
		)
		.reduce<ScheduleGroup[]>((groups, item) => {
			const key = formatDateKey(item.startTime, timeZone);
			const existingGroup = groups.find((group) => group.key === key);

			if (existingGroup) {
				existingGroup.items.push(item);
				return groups;
			}

			const day = Number(
				dateFormatter
					.formatToParts(item.startTime)
					.find((part) => part.type === "day")?.value
			);
			const suffix =
				day % 100 >= 11 && day % 100 <= 13
					? "th"
					: (({ 1: "st", 2: "nd", 3: "rd" } as Record<number, string>)[
							day % 10
						] ?? "th");
			groups.push({
				key,
				label: dateFormatter.format(item.startTime) + (ordinal ? suffix : ""),
				items: [item]
			});

			return groups;
		}, []);
}

type ScheduleSectionProps = {
	title: string;
	items: ScheduleItemData[];
	now: Date;
	emptyTitle: string;
	emptyDescription: string;
	variant?: "default" | "timeline";
	timeZone?: string;
};

export function ScheduleSection({
	title,
	items,
	now,
	emptyTitle,
	emptyDescription,
	variant = "default",
	timeZone
}: ScheduleSectionProps) {
	const groupedItems = groupScheduleItemsByDate(
		items,
		timeZone,
		variant === "timeline"
	);
	const todayKey = formatDateKey(now, timeZone);
	const timeline = variant === "timeline";

	return (
		<section className={cn("flex flex-col", timeline ? "gap-4" : "gap-5")}>
			<h2
				className={cn(
					"font-medium",
					timeline ? "text-[22px]/7" : "text-dark-grey text-lg"
				)}
			>
				{title}
			</h2>

			{groupedItems.length > 0 ? (
				<div
					className={cn(
						"grid items-start xl:grid-cols-2",
						timeline ? "gap-6" : "gap-8"
					)}
				>
					{groupedItems.map((group) => (
						<div
							className={cn(
								"flex min-w-0 flex-col",
								timeline ? "gap-2" : "gap-4"
							)}
							key={group.key}
						>
							<h3
								className={cn(
									timeline ? "text-base/6" : "text-dark-grey text-sm",
									group.key === todayKey ? "font-semibold" : "font-normal"
								)}
							>
								{group.label}
							</h3>
							<ol
								className={cn(
									"flex flex-col border-l-4",
									timeline
										? "gap-4 border-grey-300 pl-2"
										: "gap-10 border-medium-grey py-1 pl-4 md:gap-8"
								)}
							>
								{group.items.map((item) => (
									<ScheduleItem
										item={item}
										key={item.id}
										now={now}
										timeZone={timeZone}
										variant={variant}
									/>
								))}
							</ol>
						</div>
					))}
				</div>
			) : (
				<Empty>
					<EmptyHeader>
						<EmptyTitle>{emptyTitle}</EmptyTitle>
						<EmptyDescription>{emptyDescription}</EmptyDescription>
					</EmptyHeader>
				</Empty>
			)}
		</section>
	);
}
