import { Alarm2Line, ArrowRightLine, LocationLine } from "@mingcute/react";
import Link from "next/link";
import type { ReactNode } from "react";
import { Button } from "@/app/components/ui/button";
import { cn } from "@/lib/utils";

interface BannerProps {
	title: string;
	description: string;
	buttonText: string;
	colour: "purple" | "red";
	image?: ReactNode;
	location?: string;
	startTime?: Date;
	endTime?: Date;
	href?: string;
	onClick?: () => void;
	className?: string;
}

export default function Banner({
	colour,
	image,
	title,
	description,
	buttonText,
	location,
	startTime,
	endTime,
	href,
	onClick,
	className
}: BannerProps) {
	const colors = {
		purple: {
			background: "bg-primary",
			button: "bg-purple-50 text-purple-800 hover:bg-purple-50/90"
		},
		red: {
			background: "bg-red-700",
			button: "bg-red-50 text-red-900 hover:bg-red-50/90"
		}
	};
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
		<div className={cn("@container w-full", className)}>
			<div
				className={cn(
					"relative flex @4xl:flex-row flex-col items-start justify-between @4xl:gap-6 gap-32 overflow-hidden rounded-[16px] p-6",
					colors[colour].background
				)}
			>
				<div className="z-1 flex w-full max-w-100 flex-col gap-4">
					<div className="flex flex-col gap-1">
						<h1 className="font-semibold text-3xl text-white">{title}</h1>
						<div className="flex flex-row flex-wrap gap-x-6 gap-y-1">
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
					<p className="text-white">{description}</p>
				</div>
				{href ? (
					<Button
						className={cn("z-1 shadow", colors[colour].button)}
						nativeButton={false}
						render={<Link href={href} />}
					>
						{buttonText}
						<ArrowRightLine data-icon="inline-end" />
					</Button>
				) : (
					onClick && (
						<Button
							className={cn("z-1 shadow", colors[colour].button)}
							onClick={onClick}
							type="button"
						>
							{buttonText}
							<ArrowRightLine data-icon="inline-end" />
						</Button>
					)
				)}
				{image && (
					<div
						aria-hidden="true"
						className="@4xl:-top-19 -right-6.5 -bottom-8.5 pointer-events-none absolute @4xl:right-auto @4xl:bottom-auto @4xl:left-[max(26.75rem,calc(100%-37.25rem))] z-0 @4xl:h-84 h-54 w-max"
					>
						{image}
					</div>
				)}
			</div>
		</div>
	);
}
