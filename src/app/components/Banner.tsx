import { Alarm2Line, ArrowRightLine, LocationLine } from "@mingcute/react";
import Link from "next/link";
import type { ReactNode } from "react";
import { Button } from "@/app/components/ui/button";
import { formatTime } from "@/lib/datetime";
import { cn } from "@/lib/utils";

interface BannerProps {
	title: string;
	description?: string;
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
	const timeRange = [startTime, endTime]
		.filter((time) => time !== undefined)
		.map((time) => formatTime(time))
		.join(" - ");
	const hasAction = Boolean(href || onClick);

	return (
		<div className={cn("@container w-full", className)}>
			<div
				className={cn(
					"relative flex @4xl:flex-row flex-col items-start justify-between @4xl:gap-6 gap-32 overflow-hidden rounded-[16px] p-6",
					colors[colour].background,
					// Without a button, keeps the stacked layout's room for the image
					image && !hasAction && "@4xl:pb-6 pb-49"
				)}
			>
				<div className="z-1 flex w-full max-w-100 flex-col gap-8">
					<div className="flex flex-col gap-4">
						<h2 className="font-medium text-3xl text-white">{title}</h2>
						{location && (startTime || endTime) && (
							<div className="flex flex-row flex-wrap gap-x-6 gap-y-2">
								{location && (
									<div className="flex flex-row items-center gap-2 text-white opacity-80">
										<LocationLine className="size-6" />
										<p className="whitespace-nowrap font-medium text-[14px] text-white leading-5">
											{location}
										</p>
									</div>
								)}
								{(startTime || endTime) && (
									<div className="flex flex-row items-center gap-2 text-white opacity-80">
										<Alarm2Line className="size-6" />
										<p className="whitespace-nowrap font-medium text-[14px] text-white leading-5">
											{timeRange}
										</p>
									</div>
								)}
							</div>
						)}
					</div>
					{description && <p className="text-white">{description}</p>}
					{
						!description && (
							<div />
						) /* This ensures some spacing from the parent div's flexbox gap when there is no description. */
					}
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
