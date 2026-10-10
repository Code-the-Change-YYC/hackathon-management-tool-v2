"use client";

import Image from "next/image";
import { Fragment, useEffect, useState } from "react";
import { twMerge } from "tailwind-merge";
import type { TimeLeft } from "@/types/landingPage";

const HACKATHON_DATE = new Date("2026-11-07T09:00:00-07:00");
const ZERO_TIME: TimeLeft = { days: 0, hours: 0, minutes: 0, seconds: 0 };
const MS_PER_DAY = 1000 * 60 * 60 * 24;

// Null until mounted, so the tiles first render with the real time instead of
// flipping over from 00 on page load.
function useCountdown(targetDate: Date): TimeLeft | null {
	const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);

	useEffect(() => {
		const calculate = (): TimeLeft => {
			const diff = targetDate.getTime() - Date.now();
			if (diff <= 0) return ZERO_TIME;
			return {
				days: Math.floor(diff / MS_PER_DAY),
				hours: new Date(diff).getUTCHours(),
				minutes: new Date(diff).getUTCMinutes(),
				seconds: new Date(diff).getUTCSeconds()
			};
		};

		setTimeLeft(calculate());
		const timer = setInterval(() => setTimeLeft(calculate()), 1000);
		return () => clearInterval(timer);
	}, [targetDate]);

	return timeLeft;
}

type CountdownTileProps = {
	name: string;
	value: number;
	className?: string;
};

type TileHalfProps = {
	half: "top" | "bottom";
	value: number;
	className?: string;
};

function TileHalf({ half, value, className }: TileHalfProps) {
	return (
		<div
			className={twMerge(
				"absolute inset-x-0 h-1/2 overflow-hidden bg-awesome-purple shadow",
				half === "top"
					? "top-0 origin-bottom rounded-t-2xl"
					: "bottom-0 origin-top rounded-b-2xl",
				className
			)}
		>
			<span
				className={twMerge(
					"absolute inset-x-0 flex h-[200%] items-center justify-center",
					half === "top" ? "top-0" : "bottom-0"
				)}
			>
				{String(value).padStart(2, "0")}
			</span>
		</div>
	);
}

function CountdownTile({ name, value, className }: CountdownTileProps) {
	const [current, setCurrent] = useState(value);
	const [previous, setPrevious] = useState(value);
	const [flipCount, setFlipCount] = useState(0);

	if (value !== current) {
		setPrevious(current);
		setCurrent(value);
		setFlipCount((count) => count + 1);
	}

	return (
		<div
			className={twMerge(
				"perspective-normal relative aspect-square w-20 font-semibold text-4xl text-white sm:w-24 sm:text-5xl md:w-32 md:text-7xl lg:text-8xl",
				className
			)}
		>
			<TileHalf half="top" value={current} />
			<TileHalf half="bottom" value={previous} />
			{flipCount > 0 && (
				<Fragment key={flipCount}>
					<TileHalf
						className="animate-flip-top motion-reduce:hidden"
						half="top"
						value={previous}
					/>
					<TileHalf
						className="animate-flip-bottom motion-reduce:animate-none"
						half="bottom"
						value={current}
					/>
				</Fragment>
			)}
			<div className="-translate-y-1/2 absolute inset-x-0 top-1/2 border-white/50 border-b-2" />
			<span className="-bottom-6 absolute w-full text-center font-semibold text-awesome-purple text-xs uppercase tracking-widest sm:text-sm">
				{name}
			</span>
		</div>
	);
}

function CountdownWindow({ children }: { children: React.ReactNode }) {
	return (
		<div className="relative mx-auto hidden w-full max-w-270 flex-col overflow-hidden rounded-t-xl bg-white shadow-2xl md:flex">
			<div className="flex items-center gap-2 px-4 py-4">
				<div className="size-3 rounded-full border border-primary/60" />
				<div className="size-3 rounded-full border border-primary/60" />
				<div className="size-3 rounded-full border border-primary/60" />
			</div>

			<div className="border border-x-dark-green border-t-dark-green bg-dark-green/50 px-14 pt-10">
				<div className="rounded-t-[30px] bg-pastel-green px-8 pt-10 pb-24">
					{children}
				</div>
			</div>
		</div>
	);
}

export default function Countdown() {
	const timeLeft = useCountdown(HACKATHON_DATE);

	return (
		<CountdownWindow>
			<div className="mb-8 flex flex-col items-center gap-3">
				<p className="text-center font-bold text-4xl text-awesomer-purple">
					Hack the Change 2026 begins in...
				</p>
				<Image
					alt=""
					className="h-auto w-auto"
					height={16}
					src="/svgs/landingPage/purple_underline.svg"
					width={140}
				/>
			</div>

			<div className="flex flex-row items-center justify-center gap-3 py-4">
				{timeLeft && (
					<>
						<CountdownTile name="Days" value={timeLeft.days} />
						<CountdownTile name="Hours" value={timeLeft.hours} />
						<CountdownTile name="Minutes" value={timeLeft.minutes} />
						<CountdownTile name="Seconds" value={timeLeft.seconds} />
					</>
				)}
			</div>
		</CountdownWindow>
	);
}
