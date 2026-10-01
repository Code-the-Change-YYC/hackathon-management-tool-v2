"use client";
import { ArrowLeftLine, ArrowRightLine } from "@mingcute/react";
import { type CSSProperties, useMemo, useState } from "react";
import { Button } from "@/app/components/ui/button";
import { formatTime } from "@/lib/datetime";
import type { SlotMinutes } from "@/lib/judging";
import { cn } from "@/lib/utils";
import type { RouterOutputs } from "@/trpc/react";

type Assignment = RouterOutputs["judgingAssignments"]["getByRound"][number];
type Room = RouterOutputs["judgingRooms"]["getLayoutByRound"]["rooms"][number];
const SLOTS_PER_PAGE = 48;
function buildTimeSlots(
	startTime: Date,
	endTime: Date,
	slotMinutes: SlotMinutes
) {
	const slotCount = Math.max(
		0,
		Math.floor(
			(endTime.getTime() - startTime.getTime()) / (slotMinutes * 60_000)
		)
	);
	const slotMs = slotMinutes * 60_000;

	return Array.from({ length: slotCount }, (_, index) => {
		return new Date(startTime.getTime() + index * slotMs);
	});
}

export function AdminScheduleGrid({
	assignments,
	isLoading,
	rooms,
	roundEnd,
	roundStart,
	slotMinutes
}: {
	assignments: Assignment[];
	isLoading: boolean;
	rooms: Room[];
	roundEnd?: Date;
	roundStart?: Date;
	slotMinutes: SlotMinutes;
}) {
	const slots = useMemo(
		() =>
			roundStart && roundEnd
				? buildTimeSlots(roundStart, roundEnd, slotMinutes)
				: [],
		[roundEnd, roundStart, slotMinutes]
	);
	const [slotPage, setSlotPage] = useState(0);
	const pageCount = Math.max(1, Math.ceil(slots.length / SLOTS_PER_PAGE));
	const safeSlotPage = Math.min(slotPage, pageCount - 1);
	const pageStart = safeSlotPage * SLOTS_PER_PAGE;
	const visibleSlots = slots.slice(pageStart, pageStart + SLOTS_PER_PAGE);

	if (isLoading) {
		return (
			<div
				aria-live="polite"
				className="flex min-h-56 items-center justify-center rounded-2xl bg-muted text-muted-foreground"
			>
				Loading schedule…
			</div>
		);
	}

	if (!roundStart || !roundEnd) {
		return (
			<div className="flex min-h-48 items-center justify-center rounded-2xl border border-border border-dashed px-6 text-center text-muted-foreground">
				Create or select a judging round above to view its schedule.
			</div>
		);
	}

	if (rooms.length === 0) {
		return (
			<div className="flex min-h-48 items-center justify-center rounded-2xl border border-border border-dashed px-6 text-center text-muted-foreground">
				No rooms yet. Use Assign to rooms above to create rooms and place passed
				teams.
			</div>
		);
	}

	const scheduleStyle: CSSProperties & { "--room-count": number } = {
		"--room-count": rooms.length
	};

	return (
		<div className="flex flex-col gap-3">
			{slots.length > SLOTS_PER_PAGE ? (
				<div className="flex flex-wrap items-center justify-between gap-3">
					<p className="m-0 text-muted-foreground text-sm">
						Showing slots {pageStart + 1}-
						{Math.min(pageStart + SLOTS_PER_PAGE, slots.length)} of{" "}
						{slots.length}
					</p>
					<div className="flex gap-2">
						<Button
							disabled={safeSlotPage === 0}
							onClick={() => setSlotPage((page) => Math.max(0, page - 1))}
							size="sm"
							type="button"
							variant="outline"
						>
							<ArrowLeftLine data-icon="inline-start" />
							Previous
						</Button>
						<Button
							disabled={safeSlotPage >= pageCount - 1}
							onClick={() =>
								setSlotPage((page) => Math.min(pageCount - 1, page + 1))
							}
							size="sm"
							type="button"
							variant="outline"
						>
							Next
							<ArrowRightLine data-icon="inline-end" />
						</Button>
					</div>
				</div>
			) : null}

			<div className="overflow-x-auto rounded-2xl">
				<div
					className="grid min-w-[max(100%,calc(var(--time-column)+var(--room-count)*var(--room-column)))] grid-cols-[minmax(var(--time-column),0.8fr)_repeat(var(--room-count),minmax(var(--room-column),1fr))] [--room-column:120px] [--time-column:82px] lg:[--room-column:160px] lg:[--time-column:128px]"
					style={scheduleStyle}
				>
					<div
						className={cn(
							"flex min-h-10 items-center justify-center border-dashboard-grey border-r border-b bg-primary p-2 text-center font-medium text-primary-foreground text-sm leading-5 lg:min-h-12 lg:text-base lg:leading-6",
							"justify-start rounded-tl-2xl"
						)}
					>
						Times
					</div>
					{rooms.map((room, roomIndex) => (
						<div
							className={cn(
								"flex min-h-10 items-center justify-center border-dashboard-grey border-r border-b bg-primary p-2 text-center font-medium text-primary-foreground text-sm leading-5 lg:min-h-12 lg:text-base lg:leading-6",
								roomIndex === rooms.length - 1 && "rounded-tr-2xl"
							)}
							key={room.id}
						>
							{room.name}
						</div>
					))}

					{visibleSlots.map((slot, slotIndex) => {
						const slotEnd = slot.getTime() + slotMinutes * 60 * 1000;
						const isLastVisibleSlot = slotIndex === visibleSlots.length - 1;
						return (
							<div className="contents" key={slot.toISOString()}>
								<div
									className={cn(
										"min-h-17 border-dashboard-grey border-r border-b bg-background px-2 py-2 font-medium text-foreground text-sm leading-5 lg:min-h-22 lg:px-1 lg:text-base lg:leading-6",
										(pageStart + slotIndex) % 2 === 0 && "bg-dashboard-grey",
										isLastVisibleSlot && "rounded-bl-2xl"
									)}
								>
									{formatTime(slot)}
								</div>
								{rooms.map((room, roomIndex) => {
									const cellAssignments = assignments.filter((assignment) => {
										if (
											assignment.room.id !== room.id ||
											!assignment.timeSlot
										) {
											return false;
										}
										const assignmentTime = new Date(
											assignment.timeSlot
										).getTime();
										return (
											assignmentTime >= slot.getTime() &&
											assignmentTime < slotEnd
										);
									});

									return (
										<div
											className={cn(
												"flex min-h-17 flex-col justify-center gap-1 border-dashboard-grey border-r border-b bg-light-grey px-1 py-1 lg:min-h-22",
												isLastVisibleSlot &&
													roomIndex === rooms.length - 1 &&
													"rounded-br-2xl"
											)}
											key={`${slot.toISOString()}-${room.id}`}
										>
											{cellAssignments.map((assignment) => (
												<div
													className="truncate rounded-lg border border-awesome-purple bg-lilac-purple px-2 py-1.5 text-center font-semibold text-primary text-sm leading-5 lg:px-2 lg:py-2 lg:text-base"
													key={assignment.id}
													title={assignment.team.name}
												>
													{assignment.team.name}
												</div>
											))}
										</div>
									);
								})}
							</div>
						);
					})}
				</div>
			</div>
		</div>
	);
}
