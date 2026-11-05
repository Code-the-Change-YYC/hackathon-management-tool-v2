"use client";

import { Accordion as AccordionPrimitive } from "@base-ui/react/accordion";
import {
	Alarm1Line,
	DownLine,
	LocationLine,
	Search3Line
} from "@mingcute/react";
import { useState } from "react";
import { groupScheduleItemsByDate } from "@/app/components/Schedule";
import {
	EVENT_TYPE_THEMES,
	EventTypeIcon,
	getScheduleItemStatus
} from "@/app/components/ScheduleItem";
import {
	Accordion,
	AccordionContent,
	AccordionItem
} from "@/app/components/ui/accordion";
import { Badge } from "@/app/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/app/components/ui/card";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyTitle
} from "@/app/components/ui/empty";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput
} from "@/app/components/ui/input-group";
import { Skeleton } from "@/app/components/ui/skeleton";
import { formatTime } from "@/lib/datetime";
import { cn, range } from "@/lib/utils";
import {
	DIETARY_RESTRICTION_LABELS,
	toDietaryRestrictions
} from "@/lib/validation/signup";
import type { RouterOutputs } from "@/trpc/react";
import { EventStatus } from "@/types/types";

type MealWithCheckIns = RouterOutputs["meals"]["getMealCheckIns"][number];
type CheckIn = MealWithCheckIns["attendance"][number];

function CheckInList({ checkIns }: { checkIns: CheckIn[] }) {
	const [search, setSearch] = useState("");

	if (checkIns.length === 0) {
		return (
			<p className="py-2 text-muted-foreground">No one has checked in yet.</p>
		);
	}

	const query = search.trim().toLowerCase();
	const matches = checkIns.filter((checkIn) =>
		checkIn.user.name.toLowerCase().includes(query)
	);

	return (
		<div className="flex flex-col gap-3 pt-1">
			<InputGroup className="h-9 sm:max-w-64">
				<InputGroupAddon>
					<Search3Line />
				</InputGroupAddon>
				<InputGroupInput
					aria-label="Search check-ins by name"
					onChange={(event) => setSearch(event.target.value)}
					placeholder="Search name"
					value={search}
				/>
			</InputGroup>
			{matches.length === 0 ? (
				<p className="py-2 text-muted-foreground">No matching check-ins.</p>
			) : (
				<ul className="max-h-96 divide-y overflow-y-auto rounded-lg border">
					{matches.map((checkIn) => (
						<li
							className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2"
							key={checkIn.id}
						>
							<span className="min-w-0 font-medium">{checkIn.user.name}</span>
							<span className="flex flex-wrap gap-1">
								{toDietaryRestrictions(checkIn.user.dietaryRestrictions).map(
									(restriction) => (
										<Badge
											className="h-4 px-1.5 py-0 text-xs"
											key={restriction}
											variant="destructive"
										>
											{DIETARY_RESTRICTION_LABELS[restriction]}
										</Badge>
									)
								)}
							</span>
							<time
								className="ml-auto text-muted-foreground text-xs tabular-nums"
								dateTime={checkIn.createdAt.toISOString()}
							>
								{formatTime(checkIn.createdAt)}
							</time>
						</li>
					))}
				</ul>
			)}
		</div>
	);
}

function MealCheckInsItem({
	meal,
	now
}: {
	meal: MealWithCheckIns;
	now: Date;
}) {
	const status = getScheduleItemStatus(meal, now);
	const showStatusBadge = status !== "Scheduled" && status !== "Completed";

	return (
		<AccordionItem value={meal.id}>
			<AccordionPrimitive.Header render={(props) => <h4 {...props} />}>
				<AccordionPrimitive.Trigger className="group/trigger flex w-full cursor-pointer items-center gap-3 rounded-lg py-3 text-left outline-none focus-visible:ring-1 focus-visible:ring-ring sm:gap-4">
					<EventTypeIcon
						className="hidden size-12 p-3 sm:flex"
						type={meal.type}
					/>
					<span className="flex min-w-0 flex-1 flex-col gap-1">
						<span className="wrap-break-word font-medium text-base">
							{meal.title}
						</span>
						<span className="flex flex-wrap items-center gap-x-3 gap-y-1 font-medium text-muted-foreground text-xs/4">
							<span className="flex items-center gap-1">
								<Alarm1Line aria-hidden className="size-4 shrink-0" />
								{formatTime(meal.startTime)} – {formatTime(meal.endTime)}
							</span>
							<span className="wrap-anywhere flex min-w-0 items-center gap-1">
								<LocationLine aria-hidden className="size-4 shrink-0" />
								{meal.location || "Location TBA"}
							</span>
							{showStatusBadge && (
								<Badge
									className={cn(
										"px-2 py-0 text-[11px]",
										EVENT_TYPE_THEMES[meal.type].badgeClassName
									)}
								>
									{status}
								</Badge>
							)}
							{meal.status === EventStatus.DRAFT && (
								<Badge className="px-2 py-0 text-[11px]" variant="outline">
									Hidden
								</Badge>
							)}
						</span>
					</span>
					<span className="flex shrink-0 flex-col items-end text-muted-foreground text-xs sm:flex-row sm:items-baseline sm:gap-1 sm:text-sm">
						<span className="font-semibold text-foreground text-lg tabular-nums">
							{meal.attendance.length}
						</span>{" "}
						checked in
					</span>
					<DownLine
						aria-hidden
						className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-aria-expanded/trigger:rotate-180"
					/>
				</AccordionPrimitive.Trigger>
			</AccordionPrimitive.Header>
			<AccordionContent>
				<CheckInList checkIns={meal.attendance} />
			</AccordionContent>
		</AccordionItem>
	);
}

export function MealCheckInsCard({
	meals,
	now
}: {
	meals: MealWithCheckIns[];
	now: Date;
}) {
	const groups = groupScheduleItemsByDate(meals);

	return (
		<Card>
			<CardHeader>
				<h2 className="font-medium text-xl">Meal Check-ins</h2>
			</CardHeader>
			<CardContent>
				{groups.length === 0 ? (
					<Empty>
						<EmptyHeader>
							<EmptyTitle>No meals have been scheduled yet</EmptyTitle>
							<EmptyDescription>
								Check-ins will appear here once meals are added.
							</EmptyDescription>
						</EmptyHeader>
					</Empty>
				) : (
					<div className="flex flex-col gap-6">
						{groups.map((group) => (
							<section
								aria-labelledby={`meal-day-${group.key}`}
								className="flex flex-col"
								key={group.key}
							>
								<h3 className="font-medium" id={`meal-day-${group.key}`}>
									{group.label}
								</h3>
								<Accordion multiple>
									{group.items.map((meal) => (
										<MealCheckInsItem key={meal.id} meal={meal} now={now} />
									))}
								</Accordion>
							</section>
						))}
					</div>
				)}
			</CardContent>
		</Card>
	);
}

export function MealCheckInsCardSkeleton() {
	return (
		<Card>
			<CardHeader>
				<h2 className="font-medium text-xl">Meal Check-ins</h2>
			</CardHeader>
			<CardContent className="flex flex-col gap-3">
				<Skeleton className="my-0.5 h-4 w-40" />
				{range(4).map((index) => (
					<div className="flex items-center gap-4 py-3" key={index}>
						<Skeleton className="hidden size-12 shrink-0 rounded-lg sm:block" />
						<div className="flex flex-1 flex-col gap-2">
							<Skeleton className="h-4 w-2/5" />
							<Skeleton className="h-3 w-3/5" />
						</div>
						<Skeleton className="h-5 w-24" />
					</div>
				))}
			</CardContent>
		</Card>
	);
}
