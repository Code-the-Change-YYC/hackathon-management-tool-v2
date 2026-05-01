"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

// TODO: Wire this to api.hackathonSettings when available
const HACKATHON_START = new Date("2026-11-11T09:00:00-07:00");
const HACKATHON_END = new Date("2026-11-12T18:00:00-07:00");

function buildGoogleCalendarUrl() {
	const fmt = (d: Date) =>
		`${d.toISOString().replace(/[-:]/g, "").split(".")[0]}Z`;
	const params = new URLSearchParams({
		action: "TEMPLATE",
		text: "Hack the Change 2026",
		dates: `${fmt(HACKATHON_START)}/${fmt(HACKATHON_END)}`,
		details: "Two-day for-charity hackathon hosted by Code the Change YYC",
		location: "Calgary, AB"
	});
	return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function buildIcsContent() {
	const fmt = (d: Date) =>
		`${d.toISOString().replace(/[-:]/g, "").split(".")[0]}Z`;
	return [
		"BEGIN:VCALENDAR",
		"VERSION:2.0",
		"BEGIN:VEVENT",
		`DTSTART:${fmt(HACKATHON_START)}`,
		`DTEND:${fmt(HACKATHON_END)}`,
		"SUMMARY:Hack the Change 2026",
		"DESCRIPTION:Two-day for-charity hackathon hosted by Code the Change YYC",
		"LOCATION:Calgary\\, AB",
		"END:VEVENT",
		"END:VCALENDAR"
	].join("\r\n");
}

function buildOutlookUrl() {
	const fmt = (d: Date) => d.toISOString();
	const params = new URLSearchParams({
		path: "/calendar/action/compose",
		rru: "addevent",
		subject: "Hack the Change 2026",
		startdt: fmt(HACKATHON_START),
		enddt: fmt(HACKATHON_END),
		body: "Two-day for-charity hackathon hosted by Code the Change YYC"
	});
	return `https://outlook.live.com/calendar/0/action/compose?${params.toString()}`;
}

interface TimeLeft {
	days: number;
	hours: number;
	minutes: number;
	seconds: number;
}

function getTimeLeft(): TimeLeft {
	const diff = Math.max(0, HACKATHON_START.getTime() - Date.now());
	return {
		days: Math.floor(diff / 86400000),
		hours: Math.floor((diff % 86400000) / 3600000),
		minutes: Math.floor((diff % 3600000) / 60000),
		seconds: Math.floor((diff % 60000) / 1000)
	};
}

function FlipBox({ value, label }: { value: number; label: string }) {
	return (
		<div className="flex flex-col items-center">
			<div className="flex h-14 w-14 items-center justify-center rounded-xl bg-awesomer-purple font-bold text-3xl text-white shadow-md sm:h-16 sm:w-16 sm:text-4xl">
				{String(value).padStart(2, "0")}
			</div>
			<span className="mt-1 font-medium text-awesomer-purple text-xs uppercase tracking-widest">
				{label}
			</span>
		</div>
	);
}

export default function CountdownCard() {
	const [timeLeft, setTimeLeft] = useState<TimeLeft>(getTimeLeft);
	const [icsUrl, setIcsUrl] = useState("");

	useEffect(() => {
		const blob = new Blob([buildIcsContent()], {
			type: "text/calendar;charset=utf-8"
		});
		const url = URL.createObjectURL(blob);
		setIcsUrl(url);
		return () => URL.revokeObjectURL(url);
	}, []);

	useEffect(() => {
		const id = setInterval(() => setTimeLeft(getTimeLeft()), 1000);
		return () => clearInterval(id);
	}, []);

	return (
		<div className="w-full overflow-hidden rounded-2xl bg-white shadow-lg">
			{/* Browser-window chrome */}
			<div className="flex items-center gap-1.5 bg-lilac-purple px-4 py-3">
				<span className="h-3 w-3 rounded-full bg-white/40" />
				<span className="h-3 w-3 rounded-full bg-white/40" />
				<span className="h-3 w-3 rounded-full bg-white/40" />
			</div>

			<div className="px-6 py-8 text-center">
				<p className="font-bold text-awesomer-purple text-xl sm:text-2xl">
					Thank you.
				</p>
				<p className="font-semibold text-awesomer-purple text-lg sm:text-xl">
					Your registration is complete!
				</p>
				<div className="mx-auto mt-1 h-1 w-16 rounded-full bg-dark-green" />

				<p className="mt-5 font-semibold text-base text-dark-grey">
					Hack the Change 2026 begins…
				</p>

				{/* Countdown */}
				<div className="mt-4 flex justify-center gap-3 sm:gap-4">
					<FlipBox label="Days" value={timeLeft.days} />
					<FlipBox label="Hours" value={timeLeft.hours} />
					<FlipBox label="Minutes" value={timeLeft.minutes} />
					<FlipBox label="Seconds" value={timeLeft.seconds} />
				</div>

				{/* Date badges */}
				<div className="mt-6 flex items-center justify-center gap-2">
					<div className="flex flex-col items-center justify-center rounded-xl bg-awesomer-purple px-4 py-2 font-bold text-white">
						<span className="text-xl tracking-widest sm:text-2xl">NOV</span>
					</div>
					<div className="flex items-center justify-center rounded-xl bg-awesomer-purple px-4 py-3 font-bold text-3xl text-white sm:text-4xl">
						11
					</div>
					<span className="font-semibold text-dark-grey text-lg">to</span>
					<div className="flex items-center justify-center rounded-xl bg-awesomer-purple px-4 py-3 font-bold text-3xl text-white sm:text-4xl">
						12
					</div>
				</div>

				<p className="mt-5 text-dark-grey text-sm leading-relaxed">
					Join us for the two-day for-charity hackathon hosted
					<br />
					on November 11th to 12th by{" "}
					<a
						className="font-semibold text-awesomer-purple underline hover:text-awesome-purple"
						href="https://codethechangeyyc.ca"
						rel="noopener noreferrer"
						target="_blank"
					>
						Code the Change YYC
					</a>
					.
				</p>

				{/* Calendar buttons */}
				<div className="mt-6 flex flex-wrap justify-center gap-3">
					<Link
						className="rounded-full bg-awesomer-purple px-4 py-2 font-semibold text-sm text-white transition hover:bg-awesome-purple"
						href={buildGoogleCalendarUrl()}
						rel="noopener noreferrer"
						target="_blank"
					>
						Add to your
						<br />
						Google Calendar
					</Link>
					<Link
						className="rounded-full bg-awesomer-purple px-4 py-2 font-semibold text-sm text-white transition hover:bg-awesome-purple"
						href={buildOutlookUrl()}
						rel="noopener noreferrer"
						target="_blank"
					>
						Add to your
						<br />
						Outlook Calendar
					</Link>
					{icsUrl && (
						<a
							className="rounded-full bg-awesomer-purple px-4 py-2 font-semibold text-sm text-white transition hover:bg-awesome-purple"
							download="hack-the-change-2026.ics"
							href={icsUrl}
						>
							Add to your
							<br />
							iCal Calendar
						</a>
					)}
				</div>
			</div>
		</div>
	);
}
