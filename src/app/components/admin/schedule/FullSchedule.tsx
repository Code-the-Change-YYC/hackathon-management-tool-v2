"use client";

import Image from "next/image";
import filter_icon from "public/svgs/admin/filter_icon.svg"; // Placeholder icon for edit buttons, which are not visible for now
import { twMerge } from "tailwind-merge";
import ScheduleCard from "@/app/components/admin/schedule/ScheduleCard";
import {
	createDate,
	FIRST_DATE,
	getDayString,
	SECOND_DATE,
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
						"text-[#292929] text-[16px] leading-[24px]",
						sameDay(new Date(), FIRST_DATE) ? "font-semibold" : "font-medium"
					)}
				>
					{firstDayString}
				</p>
				<div className="flex w-full flex-row gap-[8px]">
					<div className="min-h-full w-[4px] rounded-full bg-[#D6D6D6]" />
					<div className="flex w-full flex-col gap-[16px]">
						<ScheduleCard
							category={"food"}
							description={
								"Start your day off right with pastries and coffee. Don't forget your food ticket!"
							}
							endTime={createDate("first", 9, 0)}
							layout={layout}
							location={"ENA 224"}
							name={"Breakfast"}
							size={size}
							startTime={createDate("first", 10, 0)}
						/>
						<ScheduleCard
							category={"ceremony"}
							description={
								"Get ready to hack! Hear from our sponsors and organizers before getting started."
							}
							endTime={createDate("first", 11, 30)}
							layout={layout}
							location={"Auditorium A"}
							name={"Opening Ceremony"}
							size={size}
							startTime={createDate("first", 10, 30)}
						/>
						<ScheduleCard
							category={"project"}
							description={
								"Time to get hacking! Work with your team to make your project a reality."
							}
							endTime={createDate("first", 20, 0)}
							layout={layout}
							location={"All Rooms"}
							name={"Hacking Begins"}
							size={size}
							startTime={createDate("first", 11, 30)}
						/>
						<ScheduleCard
							category={"food"}
							description={
								"Take a break and refuel with a tasty lunch. Vegetarian options will be available."
							}
							endTime={createDate("first", 14, 0)}
							layout={layout}
							location={"Dining Hall"}
							name={"Lunch"}
							size={size}
							startTime={createDate("first", 13, 0)}
						/>
						<ScheduleCard
							category={"activity"}
							description={
								"Show off your CS knowledge and win prizes. It's a great way to unwind from coding!"
							}
							endTime={createDate("first", 15, 0)}
							layout={layout}
							location={"Room 303"}
							name={"CS Trivia"}
							size={size}
							startTime={createDate("first", 14, 0)}
						/>
						<ScheduleCard
							category={"activity"}
							description={
								"Explore the campus and solve puzzles to find hidden keys. Work together to win!"
							}
							endTime={createDate("first", 16, 0)}
							layout={layout}
							location={"Campus Wide"}
							name={"Finders Key-pers Scavenger Hunt"}
							size={size}
							startTime={createDate("first", 15, 0)}
						/>
						<ScheduleCard
							category={"food"}
							description={
								"Enjoy a refreshing ice cream. The perfect way to recharge in the afternoon!"
							}
							endTime={createDate("first", 16, 30)}
							layout={layout}
							location={"Quad Area"}
							name={"Ice Cream Break"}
							size={size}
							startTime={createDate("first", 16, 0)}
						/>
						<ScheduleCard
							category={"food"}
							description={
								"Time for dinner! Refuel for the final ahcking session. Lots of options will be available."
							}
							endTime={createDate("first", 20, 0)}
							layout={layout}
							location={"Dining Hall"}
							name={"Dinner"}
							size={size}
							startTime={createDate("first", 19, 0)}
						/>
					</div>
				</div>
			</div>
			<div className="flex flex-col gap-[8px]">
				<p
					className={twMerge(
						"text-[#292929] text-[16px] leading-[24px]",
						sameDay(new Date(), SECOND_DATE) ? "font-semibold" : "font-medium"
					)}
				>
					{secondDayString}
				</p>
				<div className="flex w-full flex-row gap-[8px]">
					<div className="min-h-full w-[4px] rounded-full bg-[#D6D6D6]" />
					<div className="flex w-full flex-col gap-[16px]">
						<ScheduleCard
							category={"food"}
							description={
								"Power through the last few hours of hacking with a nutricious breakfast."
							}
							endTime={createDate("second", 8, 0)}
							layout={layout}
							location={"ENA 224"}
							name={"Dining Hall"}
							size={size}
							startTime={createDate("second", 9, 0)}
						/>
						<ScheduleCard
							category={"project"}
							description={
								"The dealdine is approaching! Submit your project iwht all required documents."
							}
							endTime={createDate("second", 10, 30)}
							layout={layout}
							location={"Online"}
							name={"Submissions Close"}
							size={size}
							startTime={createDate("second", 10, 0)}
						/>
						<ScheduleCard
							category={"project"}
							description={
								"Our expert judges will evaluate projects based on innovation, impact, and execution."
							}
							endTime={createDate("second", 12, 0)}
							layout={layout}
							location={"Judges Lounge"}
							name={"Judging Begins!"}
							size={size}
							startTime={createDate("second", 10, 30)}
						/>
						<ScheduleCard
							category={"activity"}
							description={
								"Celebrate the achievements of all the hackers and find out who won. Don't miss it!"
							}
							endTime={createDate("second", 1, 0)}
							layout={layout}
							location={"Auditorium A"}
							name={"Closing Ceremony"}
							size={size}
							startTime={createDate("second", 12, 0)}
						/>
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
				<h1 className="w-full whitespace-nowrap text-[#292929] text-[22px] leading-[28px]">
					Full Schedule
				</h1>
				{/* Hardcoded buttons, in case we ever need them (Missing icons, onClicks, hover) */}
				<div className="flex hidden w-fit cursor-pointer flex-row justify-center gap-[4px] rounded-full px-[12px] py-[6px] align-center">
					<p className="whitespace-nowrap">Edit schedule</p>
					<div className="h-[20px] w-[20px]">
						<Image
							alt="placeholder icon"
							className="h-full w-full"
							height={20}
							src={filter_icon}
							width={20}
						/>
					</div>
				</div>
				<div className="flex hidden w-fit cursor-pointer flex-row justify-center gap-[4px] rounded-full bg-[#7054FD] px-[12px] py-[6px] align-center">
					<p className="whitespace-nowrap text-white">Add event</p>
					<div className="h-[20px] w-[20px]">
						<Image
							alt="placeholder icon"
							className="h-full w-full"
							height={20}
							src={filter_icon}
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
