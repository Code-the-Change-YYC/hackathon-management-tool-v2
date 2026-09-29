import { Alarm2Line, ArrowRightLine, LocationLine } from "@mingcute/react";
import { cva } from "class-variance-authority";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

type BannerLayout = "vertical" | "horizontal";

const bannerVariants = cva(
	"relative w-full justify-between overflow-hidden rounded-[16px] p-6",
	{
		variants: {
			layout: {
				horizontal: "flex-row",
				vertical: "h-74.75 flex-col"
			}
		}
	}
);

const scanMealTicketsImageVariants = cva("absolute rotate-[-3.941deg]", {
	variants: {
		slot: {
			primary: "",
			secondary: ""
		},
		layout: {
			horizontal: "",
			vertical: ""
		}
	},
	compoundVariants: [
		{
			slot: "primary",
			layout: "horizontal",
			class: "-top-20 right-10 h-[313.777px] w-[313.777px]"
		},
		{
			slot: "primary",
			layout: "vertical",
			class: "right-0 bottom-0 h-[161.8805px] w-[161.8805px]"
		},
		{
			slot: "secondary",
			layout: "horizontal",
			class: "-top-20 right-68.75 h-[313.777px] w-[313.777px]"
		},
		{
			slot: "secondary",
			layout: "vertical",
			class: "-bottom-5 right-31.25 h-[195.2742px] w-[195.2742px]"
		}
	]
});

const ScanMealTicketsImages = ({
	layout = "horizontal"
}: {
	layout: BannerLayout;
}) => {
	return (
		<div className="absolute top-0 left-0 z-0 h-full w-full">
			<div
				className={scanMealTicketsImageVariants({
					slot: "primary",
					layout
				})}
			>
				<Image
					alt="pizza illustration"
					className="h-full w-full"
					height={20}
					src="/svgs/pizza.svg"
					width={20}
				/>
			</div>
			<div
				className={scanMealTicketsImageVariants({
					slot: "secondary",
					layout
				})}
			>
				<Image
					alt="breads illustration"
					className="h-full w-full"
					height={20}
					src="/svgs/breads.svg"
					width={20}
				/>
			</div>
		</div>
	);
};

export type BannerType = "ScanMealTickets";

function getBannerImages(bannerType: BannerType, layout: BannerLayout) {
	switch (bannerType) {
		case "ScanMealTickets":
			return <ScanMealTicketsImages layout={layout} />;
	}
}

export default function Banner({
	className = "flex",
	colour,
	layout,
	type,

	title,
	description,
	buttonText,
	location,
	startTime,
	endTime,
	href
}: {
	className?: string;
	colour: "purple" | "red";
	layout: "vertical" | "horizontal";
	type: BannerType;

	title: string;
	description: string;
	buttonText: string;
	location?: string;
	startTime?: Date;
	endTime?: Date;
	href?: string;
}) {
	const backgroundClass =
		colour === "purple" ? "bg-primary" : "bg-strawberry-red";
	const linkColourClass =
		colour === "purple" ? "text-awesomer-purple" : "text-strawberry-red";
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
		<div className={cn(bannerVariants({ layout }), backgroundClass, className)}>
			<div className="z-1 flex max-w-100 flex-col gap-4">
				<div className="flex flex-col gap-1">
					<h1
						className={cn(
							backgroundClass,
							"font-semibold text-[28px] text-white leading-9"
						)}
					>
						{title}
					</h1>
					<div className="flex flex-row gap-6">
						{location && (
							<div className="flex flex-row items-center gap-2 text-white">
								<LocationLine className="size-6" />
								<p className="whitespace-nowrap font-medium text-[14px] text-white leading-5">
									{location}
								</p>
							</div>
						)}
						{(startTime || endTime) && (
							<div className="flex flex-row items-center gap-2 text-white">
								<Alarm2Line className="size-6" />
								<p className="whitespace-nowrap font-medium text-[14px] text-white leading-5">
									{startTimeStr} - {endTimeStr}
								</p>
							</div>
						)}
					</div>
				</div>
				<p className={cn(backgroundClass, "text-[16px] text-white leading-6")}>
					{description}
				</p>
			</div>
			{href && (
				<Link
					className={cn(
						"z-1 flex h-fit w-fit cursor-pointer flex-row items-center gap-2 rounded-[12px] bg-pale-grey px-4 py-2.5",
						linkColourClass
					)}
					href={href}
				>
					<p className="whitespace-nowrap font-medium text-[16px] leading-6">
						{buttonText}
					</p>
					<div>
						<ArrowRightLine className="size-5" />
					</div>
				</Link>
			)}
			{getBannerImages(type, layout)}
		</div>
	);
}
