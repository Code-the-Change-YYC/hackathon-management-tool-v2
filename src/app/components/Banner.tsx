import Image from "next/image";
import clock_icon from "public/svgs/admin/clock_icon.svg";
import breads_svg from "public/svgs/admin/illustrations/breads.svg";
import pizza_svg from "public/svgs/admin/illustrations/pizza.svg";
import pin_icon from "public/svgs/admin/pin_icon.svg";
import right_arrow_icon from "public/svgs/admin/right_arrow.svg";
import { twMerge } from "tailwind-merge";

const ScanMealTicketsImage = ({
	layout
}: {
	layout: "vertical" | "horizontal";
}) => {
	return (
		<div className="absolute top-0 left-0 z-0 h-full w-full">
			<div
				className={twMerge(
					"absolute rotate-[-3.941deg]",
					layout === "horizontal"
						? "-top-[80px] right-[40px] h-[313.777px] w-[313.777px]"
						: "right-0 bottom-0 h-[161.8805px] w-[161.8805px]"
				)}
			>
				<Image
					alt="pizza illustration"
					className="h-full w-full"
					height={20}
					src={pizza_svg}
					width={20}
				/>
			</div>
			<div
				className={twMerge(
					"absolute rotate-[-3.941deg]",
					layout === "horizontal"
						? "-top-[80px] right-[275px] h-[313.777px] w-[313.777px]"
						: "-bottom-[20px] right-[125px] h-[195.2742px] w-[195.2742px]"
				)}
			>
				<Image
					alt="breads illustration"
					className="h-full w-full"
					height={20}
					src={breads_svg}
					width={20}
				/>
			</div>
		</div>
	);
};

export default function Banner({
	className = "flex",
	colour,
	layout,

	title,
	description,
	buttonText,
	location,
	startTime,
	endTime
}: {
	className?: string;
	colour: "purple" | "red";
	layout: "vertical" | "horizontal";

	title: string;
	description: string;
	buttonText: string;
	location?: string;
	startTime?: Date;
	endTime?: Date;
}) {
	const startTimeStr = startTime
		? startTime.toLocaleTimeString("en-US", {
				hour: "2-digit",
				minute: "2-digit"
			})
		: "";

	const endTimeStr = endTime
		? endTime.toLocaleTimeString("en-US", {
				hour: "2-digit",
				minute: "2-digit"
			})
		: "";

	return (
		<div
			className={twMerge(
				"relative w-fill justify-between overflow-hidden rounded-[16px] p-[24px]",
				colour === "purple" ? "bg-purple500" : "bg-red700",
				layout === "horizontal" ? "flex-row" : "h-[299px] flex-col",
				className
			)}
		>
			<div className="z-1 flex max-w-[400px] flex-col gap-[16px]">
				<div className="flex flex-col gap-[4px]">
					<h1 className="font-semibold text-[28px] text-white leading-[36px]">
						{title}
					</h1>
					<div className="flex flex-row gap-[24px]">
						{location && (
							<div className="flex flex-row items-center gap-[8px]">
								<div className="h-[24px] w-[24px]">
									<Image
										alt="pin icon"
										className="h-full w-full"
										height={20}
										src={pin_icon}
										width={20}
									/>
								</div>
								<p className="whitespace-nowrap font-medium text-[14px] text-white leading-[20px]">
									{location}
								</p>
							</div>
						)}
						{/* Because sometimes only one of the times is visible */}
						{(startTime || endTime) && (
							<div className="flex flex-row items-center gap-[8px]">
								<div className="h-[24px] w-[24px]">
									<Image
										alt="clock icon"
										className="h-full w-full"
										height={20}
										src={clock_icon}
										width={20}
									/>
								</div>
								<p className="whitespace-nowrap font-medium text-[14px] text-white leading-[20px]">
									{startTimeStr} - {endTimeStr}
								</p>
							</div>
						)}
					</div>
				</div>
				<p className="bg-purple500 font-regular text-[16px] text-white leading-[24px]">
					{description}
				</p>
			</div>
			<button
				className="z-1 flex h-fit w-fit cursor-pointer flex-row gap-[8px] rounded-[12px] bg-purple50 px-[16px] py-[10px]"
				type="button"
			>
				<p className="whitespace-nowrap font-medium text-[16px] text-purple800 leading-[24px]">
					{buttonText}
				</p>
				<div className="h-[20px] w-[20px]">
					<Image
						alt="button icon"
						className="h-full w-full"
						height={20}
						src={right_arrow_icon}
						width={20}
					/>
				</div>
			</button>
			<ScanMealTicketsImage layout={layout} />
		</div>
	);
}
