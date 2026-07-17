import Image from "next/image";
import filter_icon from "public/svgs/admin/filter_icon.svg"; // TODO: Placeholder icon for edit buttons
import { twMerge } from "tailwind-merge";
import ScheduleCard from "@/app/components/admin/schedule/ScheduleCard";

// TODO: Add actual dates
// TODO: Should these date functions be stored somewhere universally?
const firstDay = {
	year: 2026,
	month: 7,
	day: 16
};

// Create a date based on firstDay
function createDate(
	day: "first" | "second",
	hours: number,
	minutes: number,
	timezoneOffset: number
) {
	return new Date(
		Date.UTC(
			firstDay.year,
			firstDay.month - 1,
			firstDay.day + (day === "first" ? 0 : 1),
			hours + timezoneOffset,
			minutes
		)
	);
}

// Get day number with appropriate suffix
function getOrdinalDay(date: Date) {
	const day = date.getDate();

	// Exception for teen days
	if (day > 10 && day < 20) return `${day}th`;

	// Assign st, nd, rd based on the final digit
	switch (day % 10) {
		case 1:
			return `${day}st`;
		case 2:
			return `${day}nd`;
		case 3:
			return `${day}rd`;
		default:
			return `${day}th`;
	}
}

// Get day string formatted
function getDayString(date: Date) {
	const weekday = date.toLocaleDateString("en-US", {
		weekday: "long"
	});
	const month = date.toLocaleDateString("en-US", {
		month: "long"
	});
	const ordinalDay = getOrdinalDay(date);

	return `${weekday}, ${month} ${ordinalDay}`;
}

function isToday(other: Date) {
	const today = new Date();

	return (
		today.getFullYear() === other.getFullYear() &&
		today.getMonth() === other.getMonth() &&
		today.getDate() === other.getDate()
	);
}

// Using a hard-coded offset for now so we can write times in MT
const timezoneOffset = 6;
// 00:00 on first Day
const firstDayDate = createDate("first", 0, 0, timezoneOffset);
const firstDayString = getDayString(firstDayDate);
// 00:00 on second Day
const secondDayDate = createDate("second", 0, 0, timezoneOffset);
const secondDayString = getDayString(secondDayDate);

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
			{/* TODO: Change layout for tablet and mobile */}
			<div className="flex flex-row gap-[24px]">
				<div className="flex flex-col gap-[8px]">
					<p
						className={twMerge(
							"text-[#292929] text-[16px] leading-[24px]",
							isToday(firstDayDate) ? "font-semibold" : "font-medium"
						)}
					>
						{firstDayString}
					</p>
					<div className="flex w-fit flex-row gap-[8px]">
						<div className="h-full w-[4px] rounded-full bg-[#D6D6D6]" />
						<div className="flex flex-col gap-[16px]">
							<ScheduleCard
								category={"food"}
								description={
									"Start your day off right with pastries and coffee. Don't forget your food ticket!"
								}
								endTime={createDate("first", 9, 0, timezoneOffset)}
								layout={"horizontal"}
								location={"ENA 224"}
								name={"Breakfast"}
								size={"large"}
								startTime={createDate("first", 10, 0, timezoneOffset)}
							/>
							<ScheduleCard
								category={"ceremony"}
								description={
									"Get ready to hack! Hear from our sponsors and organizers before getting started."
								}
								endTime={createDate("first", 11, 30, timezoneOffset)}
								layout={"horizontal"}
								location={"Auditorium A"}
								name={"Opening Ceremony"}
								size={"large"}
								startTime={createDate("first", 10, 30, timezoneOffset)}
							/>
							<ScheduleCard
								category={"project"}
								description={
									"Time to get hacking! Work with your team to make your project a reality."
								}
								endTime={createDate("first", 20, 0, timezoneOffset)}
								layout={"horizontal"}
								location={"All Rooms"}
								name={"Hacking Begins"}
								size={"large"}
								startTime={createDate("first", 11, 30, timezoneOffset)}
							/>
							<ScheduleCard
								category={"food"}
								description={
									"Take a break and refuel with a tasty lunch. Vegetarian options will be available."
								}
								endTime={createDate("first", 14, 0, timezoneOffset)}
								layout={"horizontal"}
								location={"Dining Hall"}
								name={"Lunch"}
								size={"large"}
								startTime={createDate("first", 13, 0, timezoneOffset)}
							/>
							<ScheduleCard
								category={"activity"}
								description={
									"Show off your CS knowledge and win prizes. It's a great way to unwind from coding!"
								}
								endTime={createDate("first", 15, 0, timezoneOffset)}
								layout={"horizontal"}
								location={"Room 303"}
								name={"CS Trivia"}
								size={"large"}
								startTime={createDate("first", 14, 0, timezoneOffset)}
							/>
							<ScheduleCard
								category={"activity"}
								description={
									"Explore the campus and solve puzzles to find hidden keys. Work together to win!"
								}
								endTime={createDate("first", 16, 0, timezoneOffset)}
								layout={"horizontal"}
								location={"Campus Wide"}
								name={"Finders Key-pers Scavenger Hunt"}
								size={"large"}
								startTime={createDate("first", 15, 0, timezoneOffset)}
							/>
							<ScheduleCard
								category={"food"}
								description={
									"Enjoy a refreshing ice cream. The perfect way to recharge in the afternoon!"
								}
								endTime={createDate("first", 16, 30, timezoneOffset)}
								layout={"horizontal"}
								location={"Quad Area"}
								name={"Ice Cream Break"}
								size={"large"}
								startTime={createDate("first", 16, 0, timezoneOffset)}
							/>
							<ScheduleCard
								category={"food"}
								description={
									"Time for dinner! Refuel for the final ahcking session. Lots of options will be available."
								}
								endTime={createDate("first", 20, 0, timezoneOffset)}
								layout={"horizontal"}
								location={"Dining Hall"}
								name={"Dinner"}
								size={"large"}
								startTime={createDate("first", 19, 0, timezoneOffset)}
							/>
						</div>
					</div>
				</div>
				<div className="flex flex-col gap-[8px]">
					<p
						className={twMerge(
							"text-[#292929] text-[16px] leading-[24px]",
							isToday(secondDayDate) ? "font-semibold" : "font-medium"
						)}
					>
						{secondDayString}
					</p>
					<div className="flex flex-row gap-[8px]">
						<div className="h-full w-[4px] rounded-full bg-[#D6D6D6]" />
						<div className="flex flex-col gap-[16px]">
							<ScheduleCard
								category={"food"}
								description={
									"Power through the last few hours of hacking with a nutricious breakfast."
								}
								endTime={createDate("second", 8, 0, timezoneOffset)}
								layout={"horizontal"}
								location={"ENA 224"}
								name={"Dining Hall"}
								size={"large"}
								startTime={createDate("second", 9, 0, timezoneOffset)}
							/>
							<ScheduleCard
								category={"project"}
								description={
									"The dealdine is approaching! Submit your project iwht all required documents."
								}
								endTime={createDate("second", 10, 30, timezoneOffset)}
								layout={"horizontal"}
								location={"Online"}
								name={"Submissions Close"}
								size={"large"}
								startTime={createDate("second", 10, 0, timezoneOffset)}
							/>
							<ScheduleCard
								category={"project"}
								description={
									"Our expert judges will evaluate projects based on innovation, impact, and execution."
								}
								endTime={createDate("second", 12, 0, timezoneOffset)}
								layout={"horizontal"}
								location={"Judges Lounge"}
								name={"Judging Begins!"}
								size={"large"}
								startTime={createDate("second", 10, 30, timezoneOffset)}
							/>
							<ScheduleCard
								category={"activity"}
								description={
									"Celebrate the achievements of all the hackers and find out who won. Don't miss it!"
								}
								endTime={createDate("second", 1, 0, timezoneOffset)}
								layout={"horizontal"}
								location={"Auditorium A"}
								name={"Closing Ceremony"}
								size={"large"}
								startTime={createDate("second", 12, 0, timezoneOffset)}
							/>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
