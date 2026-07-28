"use client";

import Image from "next/image";
import edit_icon from "public/svgs/admin/edit_icon.svg";
import plus_icon from "public/svgs/admin/plus_icon.svg";
import { twMerge } from "tailwind-merge";
import ScheduleCard from "@/app/components/admin/schedule/ScheduleCard";
import {
	FIRST_DATE,
	FIRST_DAY_EVENTS,
	getDayString,
	SECOND_DATE,
	SECOND_DAY_EVENTS,
	sameDay
} from "@/types/scheduleConstants";

function ScheduleCards({
	layout,
	size,
	className
}: {
	layout: "horizontal" | "vertical";
	size: "small" | "large";
	className?: string;
}) {
	const firstDayString = getDayString(FIRST_DATE);
	const secondDayString = getDayString(SECOND_DATE);

	return (
		<div className={twMerge("flex-col gap-[24px] lg:flex-row", className)}>
			<div className="flex flex-col gap-[8px]">
				<p
					className={twMerge(
						"text-[16px] text-grey800 leading-[24px]",
						sameDay(new Date(), FIRST_DATE) ? "font-semibold" : "font-medium"
					)}
				>
					{firstDayString}
				</p>
				<div className="flex w-full flex-row gap-[8px]">
					<div className="min-h-full w-[4px] rounded-full bg-grey300" />
					<div className="flex w-full flex-col gap-[16px]">
						{FIRST_DAY_EVENTS.map((item) => (
							<ScheduleCard
								category={item.category}
								description={item.description}
								endTime={item.endTime}
								key={item.name + item.description}
								layout={layout}
								location={item.location}
								name={item.name}
								size={size}
								startTime={item.startTime}
							/>
						))}
					</div>
				</div>
			</div>
			<div className="flex flex-col gap-[8px]">
				<p
					className={twMerge(
						"text-[16px] text-grey800 leading-[24px]",
						sameDay(new Date(), SECOND_DATE) ? "font-semibold" : "font-medium"
					)}
				>
					{secondDayString}
				</p>
				<div className="flex w-full flex-row gap-[8px]">
					<div className="min-h-full w-[4px] rounded-full bg-grey300" />
					<div className="flex w-full flex-col gap-[16px]">
						{SECOND_DAY_EVENTS.map((item) => (
							<ScheduleCard
								category={item.category}
								description={item.description}
								endTime={item.endTime}
								key={item.name + item.description}
								layout={layout}
								location={item.location}
								name={item.name}
								size={size}
								startTime={item.startTime}
							/>
						))}
					</div>
				</div>
			</div>
		</div>
	);
}

export default function FullSchedule() {
	return (
		<div className="flex flex-col gap-[16px]">
			<div className="flex flex-row gap-[16px]">
				<h1 className="w-full whitespace-nowrap text-[22px] text-grey800 leading-[28px]">
					Full Schedule
				</h1>
				{/* Hardcoded buttons, in case we ever need them (Missing onClicks and hover styles) */}
				<div className="flex hidden w-fit cursor-pointer flex-row justify-center gap-[4px] rounded-full px-[12px] py-[6px] align-center">
					<p className="whitespace-nowrap">Edit schedule</p>
					<div className="h-[20px] w-[20px]">
						<Image
							alt="edit schedule"
							className="h-full w-full"
							height={20}
							src={edit_icon}
							width={20}
						/>
					</div>
				</div>
				<div className="hidden w-fit cursor-pointer flex-row justify-center gap-[4px] rounded-full bg-purple500flex px-[12px] py-[6px] align-center">
					<p className="whitespace-nowrap text-white">Add event</p>
					<div className="h-[20px] w-[20px]">
						<Image
							alt="add event"
							className="h-full w-full"
							height={20}
							src={plus_icon}
							width={20}
						/>
					</div>
				</div>
			</div>
			{/* Two, each hidden on different breakpoints to allow for variation in component props with tailwind breakpoints */}
			{/* Desktop */}
			<ScheduleCards
				className="hidden md:flex"
				layout="horizontal"
				size="large"
			/>
			{/* Mobile */}
			<ScheduleCards
				className="flex md:hidden"
				layout="vertical"
				size="large"
			/>
		</div>
	);
}
