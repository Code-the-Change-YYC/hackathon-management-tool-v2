import { cn } from "@/lib/utils";
import { ScheduleItem, type ScheduleItemData } from "./ScheduleItem";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
	weekday: "long",
	month: "long",
	day: "numeric"
});

export type ScheduleGroup = {
	key: string;
	label: string;
	items: ScheduleItemData[];
};

function formatDateKey(date: Date) {
	return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

export function groupScheduleItemsByDate(items: ScheduleItemData[]) {
	return items.reduce<ScheduleGroup[]>((groups, item) => {
		const key = formatDateKey(item.startTime);
		const existingGroup = groups.find((group) => group.key === key);

		if (existingGroup) {
			existingGroup.items.push(item);
			return groups;
		}

		groups.push({
			key,
			label: dateFormatter.format(item.startTime),
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
};

export function ScheduleSection({
	title,
	items,
	now,
	emptyTitle,
	emptyDescription
}: ScheduleSectionProps) {
	const groupedItems = groupScheduleItemsByDate(items);
	const todayKey = formatDateKey(now);

	return (
		<section className="flex flex-col gap-5">
			<h2 className="font-medium text-dark-grey text-lg">{title}</h2>

			{groupedItems.length > 0 ? (
				<div className="grid gap-8 xl:grid-cols-2">
					{groupedItems.map((group) => (
						<div className="flex flex-col gap-4" key={group.key}>
							<h3
								className={cn(
									"text-dark-grey text-sm",
									group.key === todayKey ? "font-semibold" : "font-normal"
								)}
							>
								{group.label}
							</h3>
							<ol className="flex flex-col gap-10 border-medium-grey border-l-4 py-1 pl-4 md:gap-8">
								{group.items.map((item) => (
									<ScheduleItem item={item} key={item.id} now={now} />
								))}
							</ol>
						</div>
					))}
				</div>
			) : (
				<div className="rounded-lg border border-medium-grey border-dashed bg-white px-6 py-10 text-center">
					<p className="font-semibold text-dark-grey">{emptyTitle}</p>
					<p className="mt-2 text-dark-grey/60 text-sm">{emptyDescription}</p>
				</div>
			)}
		</section>
	);
}
