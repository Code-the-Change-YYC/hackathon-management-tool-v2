import { format } from "date-fns";
import { formatLongDate } from "@/lib/datetime";
import { ScheduleItem, type ScheduleItemData } from "./ScheduleItem";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "./ui/empty";

export type ScheduleGroup = {
	key: string;
	label: string;
	items: ScheduleItemData[];
};

// TODO: do this grouping logic in the procedure instead
export function groupScheduleItemsByDate(items: ScheduleItemData[]) {
	return items.reduce<ScheduleGroup[]>((groups, item) => {
		const key = format(item.startTime, "yyyy-MM-dd");
		const existingGroup = groups.find((group) => group.key === key);

		if (existingGroup) {
			existingGroup.items.push(item);
			return groups;
		}

		groups.push({
			key,
			label: formatLongDate(item.startTime),
			items: [item]
		});

		return groups;
	}, []);
}

interface ScheduleProps {
	items: ScheduleItemData[];
	now: Date;
	emptyTitle: string;
	emptyDescription: string;
	timeZone?: string;
	showGroupLabels?: boolean;
}

export function Schedule({
	items,
	now,
	emptyTitle,
	emptyDescription,
	timeZone,
	showGroupLabels = true
}: ScheduleProps) {
	const groupedItems = groupScheduleItemsByDate(items);

	if (groupedItems.length === 0) {
		return (
			<Empty>
				<EmptyHeader>
					<EmptyTitle>{emptyTitle}</EmptyTitle>
					<EmptyDescription>{emptyDescription}</EmptyDescription>
				</EmptyHeader>
			</Empty>
		);
	}

	return (
		<div className="grid gap-8 lg:grid-flow-col">
			{groupedItems.map((group) => (
				<div className="flex w-full flex-col gap-4" key={group.key}>
					{showGroupLabels && <h3 className="font-medium">{group.label}</h3>}
					<ol className="flex flex-col gap-6">
						{group.items.map((item) => (
							<ScheduleItem
								item={item}
								key={item.id}
								now={now}
								timeZone={timeZone}
							/>
						))}
					</ol>
				</div>
			))}
		</div>
	);
}
