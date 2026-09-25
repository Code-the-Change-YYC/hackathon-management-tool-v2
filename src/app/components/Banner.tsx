import Image from "next/image";
import Link from "next/link";
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
						? "-top-20 right-10 h-[313.777px] w-[313.777px]"
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
						? "-top-20 right-68.75 h-[313.777px] w-[313.777px]"
						: "-bottom-5 right-31.25 h-[195.2742px] w-[195.2742px]"
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
				"relative w-fill justify-between overflow-hidden rounded-4 p-6",
				colour === "purple" ? "bg-purple500" : "bg-red700",
				layout === "horizontal" ? "flex-row" : "h-74.75 flex-col",
				className
			)}
		>
			<div className="z-1 flex max-w-100 flex-col gap-4">
				<div className="flex flex-col gap-1">
					<h1 className="font-semibold text-[28px] text-white leading-9">
						{title}
					</h1>
					<div className="flex flex-row gap-6">
						{location && (
							<div className="flex flex-row items-center gap-2">
								<div className="h-6 w-6">
									<Image
										alt="pin icon"
										className="h-full w-full"
										height={20}
										src={pin_icon}
										width={20}
									/>
								</div>
								<p className="whitespace-nowrap font-medium text-[14px] text-white leading-5">
									{location}
								</p>
							</div>
						)}
						{/* Because sometimes only one of the times is visible */}
						{(startTime || endTime) && (
							<div className="flex flex-row items-center gap-2">
								<div className="h-6 w-6">
									<Image
										alt="clock icon"
										className="h-full w-full"
										height={20}
										src={clock_icon}
										width={20}
									/>
								</div>
								<p className="whitespace-nowrap font-medium text-[14px] text-white leading-5">
									{startTimeStr} - {endTimeStr}
								</p>
							</div>
						)}
					</div>
				</div>
				<p className="bg-purple500 font-regular text-4 text-white leading-6">
					{description}
				</p>
			</div>
			{/* TODO: Update href to link to scanner */}
			<Link
				className="z-1 flex h-fit w-fit cursor-pointer flex-row gap-2 rounded-[12px] bg-purple50 px-4 py-2.5"
				href="/admin/meals"
			>
				<p className="whitespace-nowrap font-medium text-4 text-purple800 leading-6">
					{buttonText}
				</p>
				<div className="h-5 w-5">
					<Image
						alt="button icon"
						className="h-full w-full"
						height={20}
						src={right_arrow_icon}
						width={20}
					/>
				</div>
			</Link>
			<ScanMealTicketsImage layout={layout} />
		</div>
	);
}
