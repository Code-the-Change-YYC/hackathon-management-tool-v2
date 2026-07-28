import type { StaticImport } from "next/dist/shared/lib/get-img-props";
import Image from "next/image";
import clock_icon from "public/svgs/admin/clock_icon.svg";
import activity_icon from "public/svgs/admin/coloured_activity_icon.svg";
import ceremony_icon from "public/svgs/admin/coloured_ceremony_icon.svg";
import food_icon from "public/svgs/admin/coloured_food_icon.svg";
import project_icon from "public/svgs/admin/coloured_project_icon.svg";
import pin_icon from "public/svgs/admin/pin_icon.svg";
import { twMerge } from "tailwind-merge";

export default function ScheduleEvent({
	className,
	size,
	category,
	layout,

	name,
	location,
	startTime,
	endTime,
	description
}: {
	// css
	className?: string;

	// Determine the variant
	size: "small" | "large";
	category: "food" | "ceremony" | "project" | "activity";
	layout: "horizontal" | "vertical";

	// Passed values
	name: string;
	location: string;
	startTime: Date;
	endTime: Date;
	description: string;
}) {
	// Determine colours and icon
	let icon: StaticImport;

	let tagColour: string = "#000000";
	let separatorColour: string = "#000000";
	let iconbgColour: string = "#000000";
	// let iconColour: string = "#000000"; Can't dynamically change the colour of nextjs SVGs
	switch (category) {
		case "food":
			icon = food_icon;

			tagColour = "bg-[#EC1245]";
			separatorColour = "bg-[#FE4D6E]";
			iconbgColour = "bg-[#FFF0F3]";
			break;
		case "ceremony":
			icon = ceremony_icon;

			tagColour = "bg-[#7054FD]";
			separatorColour = "bg-[#A688FF]";
			iconbgColour = "bg-[#F7F5FF]";
			break;
		case "project":
			icon = project_icon;

			tagColour = "bg-[#E91E01]";
			separatorColour = "bg-[#FE957B]";
			iconbgColour = "bg-[#FFF9F5]";
			break;
		case "activity":
			icon = activity_icon;

			tagColour = "bg-[#038B6F]";
			separatorColour = "bg-[#1AE5AF]";
			iconbgColour = "bg-[#F1FEF8]";
			break;
	}

	const startTimeStr = startTime.toLocaleTimeString("en-US", {
		hour: "2-digit",
		minute: "2-digit"
	});
	const endTimeStr = endTime.toLocaleTimeString("en-US", {
		hour: "2-digit",
		minute: "2-digit"
	});

	// Assume start before end
	const timeUntilStartMs = startTime.getTime() - Date.now();
	const timeUntilEndMs = endTime.getTime() - Date.now();
	let timeUntilString: string;
	if (timeUntilStartMs > 1000 * 60 * 60) {
		timeUntilString = `in ${Math.floor(timeUntilStartMs / (1000 * 60 * 60))} hours`;
	} else if (timeUntilStartMs > 0) {
		timeUntilString = `in ${Math.floor(timeUntilStartMs / (1000 * 60))} mins`;
	} else if (timeUntilEndMs > 0) {
		timeUntilString = "Ongoing";
	} else {
		timeUntilString = "Completed";
	}

	const categoryString = category.slice(0, 1).toUpperCase() + category.slice(1);

	return (
		<div
			className={twMerge(
				"flex h-fit gap-[8px] rounded-[8px] bg-[#FCFCFC] px-[8px] py-[16px]",
				layout === "horizontal" ? "flex-row" : "flex-col",
				className ?? ""
			)}
		>
			<div
				className={twMerge(
					"flex items-end gap-[8px] py-[4px]",
					layout === "horizontal" ? "w-[68px] flex-col" : "flex-row"
				)}
			>
				<div className={twMerge("w-fit rounded-full px-[8px]", tagColour)}>
					<p className="text-[11px] text-white">{categoryString}</p>
				</div>
				<p className="text-[#575757] text-[11px]">{timeUntilString}</p>
			</div>
			{/* Can't get hr to work */}
			<div
				className={twMerge(
					"rounded-full",
					layout === "horizontal" ? "w-[1px]" : "h-[1px] w-full",
					separatorColour
				)}
			/>
			<div className="flex flex-1 flex-row gap-[8px]">
				<div
					className={twMerge(
						"flex items-center justify-center rounded-[8px]",
						size === "large" ? "h-[88px] w-[88px]" : "h-[56px] w-[56px]",
						iconbgColour
					)}
				>
					<Image
						alt="filter"
						className={
							size === "large" ? "h-[48px] w-[48px]" : "h-[36px] w-[36px]"
						}
						height={20}
						src={icon}
						width={20}
					/>
				</div>
				<div className="flex flex-1 flex-col gap-[8px]">
					<div className="flex flex-col gap-0">
						<p className="my-[0] py-[0] text-[16px]">{name}</p>
						<div className="flex flex-row gap-[12px] py-[4px]">
							<div className="flex flex-row items-center gap-[4px]">
								<div className="h-[20px] w-[20px]">
									<Image
										alt="filter"
										className="h-full w-full"
										height={20}
										src={pin_icon}
										width={20}
									/>
								</div>
								<p className="text-[12px]">{location}</p>
							</div>
							<div className="flex flex-row items-center gap-[4px]">
								<div className="h-[20px] w-[20px]">
									<Image
										alt="filter"
										className="h-full w-full"
										height={20}
										src={clock_icon}
										width={20}
									/>
								</div>
								<p className="whitespace-nowrap text-[12px]">
									{startTimeStr} - {endTimeStr}
								</p>
							</div>
						</div>
					</div>
					{size === "large" && <p className="text-[14px]">{description}</p>}
				</div>
			</div>
		</div>
	);
}
