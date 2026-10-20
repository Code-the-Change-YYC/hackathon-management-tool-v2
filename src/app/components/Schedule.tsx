import type { ReactNode } from "react";
import { formatDateKey, formatLongDate } from "@/lib/datetime";
import { range } from "@/lib/utils";
import { ScheduleItem, type ScheduleItemData } from "./ScheduleItem";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "./ui/empty";
import { Skeleton } from "./ui/skeleton";

export type ScheduleGroup<T extends ScheduleItemData = ScheduleItemData> = {
	key: string;
	label: string;
	items: T[];
};

// TODO: do this grouping logic in the procedure instead
export function groupScheduleItemsByDate<T extends ScheduleItemData>(
	items: T[]
) {
	return items.reduce<ScheduleGroup<T>[]>((groups, item) => {
		const key = formatDateKey(item.startTime);
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

interface ScheduleProps<T extends ScheduleItemData> {
	items: T[];
	now: Date;
	emptyTitle: string;
	emptyDescription: string;
	showGroupLabels?: boolean;
	actions?: (item: T) => ReactNode;
}

export function Schedule<T extends ScheduleItemData>({
	items,
	now,
	emptyTitle,
	emptyDescription,
	showGroupLabels = true,
	actions
}: ScheduleProps<T>) {
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
		<div className="grid grid-cols-[minmax(0,1fr)] gap-8 lg:auto-cols-fr lg:grid-flow-col">
			{groupedItems.map((group) => (
				<div className="flex w-full min-w-0 flex-col gap-4" key={group.key}>
					{showGroupLabels && <h3 className="font-medium">{group.label}</h3>}
					<ol className="flex flex-col gap-6">
						{group.items.map((item) => (
							<ScheduleItem
								actions={actions?.(item)}
								item={item}
								key={item.id}
								now={now}
							/>
						))}
					</ol>
				</div>
			))}
		</div>
	);
}

export function ScheduleItemsSkeleton({
	groups = 1,
	items = 3,
	showGroupLabels = true
}: {
	groups?: number;
	items?: number;
	showGroupLabels?: boolean;
}) {
	return (
		<div className="grid grid-cols-[minmax(0,1fr)] gap-8 lg:auto-cols-fr lg:grid-flow-col">
			{range(groups).map((group) => (
				<div className="flex w-full flex-col gap-4" key={group}>
					{showGroupLabels && <Skeleton className="my-0.5 h-4 w-40" />}
					<div className="flex flex-col gap-6">
						{range(items).map((item) => (
							<div className="flex items-start gap-4" key={item}>
								<Skeleton className="size-18 shrink-0 rounded-lg" />
								<div className="flex flex-1 flex-col gap-2">
									<div className="flex flex-col gap-0.5">
										<Skeleton className="my-1 h-4 w-2/5" />
										<Skeleton className="my-0.5 h-3 w-3/5" />
									</div>
									<Skeleton className="my-0.5 h-3 w-4/5" />
								</div>
							</div>
						))}
					</div>
				</div>
			))}
		</div>
	);
}
