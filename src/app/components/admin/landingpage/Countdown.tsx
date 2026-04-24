"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type TimeLeft = {
	days: number;
	hours: number;
	minutes: number;
	seconds: number;
};

const HACKATHON_DATE = new Date("2026-10-01T00:00:00");

function useCountdown(targetDate: Date): TimeLeft | null {
	const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);

	useEffect(() => {
		const calculate = (): TimeLeft => {
			const diff = targetDate.getTime() - Date.now();
			if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
			return {
				days: Math.floor(diff / (1000 * 60 * 60 * 24)),
				hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
				minutes: Math.floor((diff / (1000 * 60)) % 60),
				seconds: Math.floor((diff / 1000) % 60)
			};
		};

		setTimeLeft(calculate());
		const timer = setInterval(() => setTimeLeft(calculate()), 1000);
		return () => clearInterval(timer);
	}, [targetDate]);

	return timeLeft;
}

function CountdownUnit({ value, label }: { value: number; label: string }) {
	return (
		<div className="flex flex-col items-center gap-2">
			<div className="flex h-35 w-30 items-center justify-center rounded-2xl bg-awesomer-purple py-10 shadow-md">
				<span className="font-bold text-6xl text-white">
					{String(value).padStart(2, "0")}
				</span>
			</div>
			<span className="font-semibold text-white text-xs uppercase tracking-widest">
				{label}
			</span>
		</div>
	);
}

export default function Countdown() {
	const timeLeft = useCountdown(HACKATHON_DATE);

	return (
		<section className="w-full bg-awesome-purple px-6 pt-16 sm:px-12">
			<div className="mx-auto flex max-w-4xl flex-col items-center gap-6 text-center">
				<h1 className="font-bold text-5xl text-white sm:text-6xl">
					Hack the Change <span className="text-pastel-green">2026</span>
				</h1>
				<p className="max-w-lg font-semibold text-white leading-relaxed">
					Hack the Change 2026 is a hybrid two-day for-charity hackathon with
					the mission of coding a better world together.
				</p>
				<Link
					className="!text-white rounded-2xl border-3 border-white bg-awesomer-purple px-8 py-3 font-semibold transition-colors hover:bg-awesome-purple"
					href="/register"
				>
					Join Hackathon
				</Link>
				<p className="font-semibold text-sm text-white">
					Already registered?{" "}
					<Link
						className="!text-pastel-green font-semibold !hover:text-dark-green text-sm"
						href="/login"
					>
						Sign in
					</Link>
				</p>
				<div className="mt-2 w-full max-w-2xl items-center overflow-hidden rounded-2xl bg-pastel-green px-8 pt-5 pb-6 shadow-lg">
					<p className="pt-5 pb-20 font-semibold text-2xl text-awesomer-purple leading-relaxed">
						Hack the Change 2026 begins...
					</p>

					<div className="flex items-center justify-center gap-6">
						{timeLeft ? (
							<>
								<CountdownUnit label="Days" value={timeLeft.days} />
								<CountdownUnit label="Hours" value={timeLeft.hours} />
								<CountdownUnit label="Minutes" value={timeLeft.minutes} />
								<CountdownUnit label="Seconds" value={timeLeft.seconds} />
							</>
						) : (
							// placeholder while loading to avoid layout shift
							<div className="h-16" />
						)}
					</div>
				</div>
			</div>
		</section>
	);
}
