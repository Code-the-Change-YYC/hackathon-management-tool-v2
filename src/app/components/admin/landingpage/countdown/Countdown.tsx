"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import type { TimeLeft } from "@/types/landingPage";
import CountdownHero from "./CountdownHero";
import CountdownTile from "./CountdownTile";
import CountdownWindow from "./CountdownWindow";

const HACKATHON_DATE = new Date("2026-10-01T00:00:00");
const ZERO_TIME: TimeLeft = { days: 0, hours: 0, minutes: 0, seconds: 0 };
const MS_PER_DAY = 1000 * 60 * 60 * 24;
const BG_IMAGE = "/svgs/landingPage/countdown_bg.svg";

function useCountdown(targetDate: Date): TimeLeft {
	const [timeLeft, setTimeLeft] = useState<TimeLeft>(ZERO_TIME);

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

export default function Countdown() {
	const timeLeft = useCountdown(HACKATHON_DATE);

	return (
		<section className="relative w-full overflow-x-hidden px-4 pt-8 pb-0 sm:px-12 lg:px-24 lg:pt-20">
			<Image
				alt=""
				className="pointer-events-none object-cover"
				fill
				priority
				src={BG_IMAGE}
			/>

			<CountdownHero />
			<div className="relative mt-8">
				<CountdownWindow>
					<div className="mb-8 flex flex-col items-center gap-3">
						<p className="font-bold text-4xl text-awesomer-purple">
							Hack the Change 2026 begins...
						</p>
						<Image
							alt=""
							height={16}
							src="/svgs/landingPage/purple_underline.svg"
							width={140}
						/>
					</div>

					<div className="flex items-end justify-center gap-6 pb-6">
						<CountdownTile name="Days" value={timeLeft.days} />
						<CountdownTile name="Hours" value={timeLeft.hours} />
						<CountdownTile name="Minutes" value={timeLeft.minutes} />
						<CountdownTile name="Seconds" value={timeLeft.seconds} />
					</div>
				</CountdownWindow>
			</div>
		</section>
	);
}
