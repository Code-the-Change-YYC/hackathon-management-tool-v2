import { z } from "zod";
import type { EventType } from "@/types/types";

export const eventNavigationUrlSchema = z
	.string()
	.trim()
	.url()
	.refine((value) => /^https?:\/\//i.test(value), "Use an HTTP or HTTPS URL.");

export type DashboardEvent = {
	id: string;
	title: string;
	description: string;
	type: EventType;
	startTime: Date;
	endTime: Date;
	location?: string | null;
	navigationUrl?: string | null;
};

export function getCurrentEvent(events: DashboardEvent[], now: Date) {
	return events.find((event) => event.startTime <= now && now < event.endTime);
}

export function getTodayFutureEvents(events: DashboardEvent[], now: Date) {
	const todayStart = new Date(now);
	todayStart.setHours(0, 0, 0, 0);
	const todayEnd = new Date(todayStart);
	todayEnd.setDate(todayEnd.getDate() + 1);

	return events.filter(
		(event) =>
			event.endTime >= now &&
			event.startTime >= todayStart &&
			event.startTime < todayEnd
	);
}

export function countdownParts(deadline: Date, now: Date) {
	const seconds = Math.max(
		0,
		Math.floor((deadline.getTime() - now.getTime()) / 1000)
	);
	return [
		Math.floor(seconds / 86400),
		Math.floor(seconds / 3600) % 24,
		Math.floor(seconds / 60) % 60,
		seconds % 60
	];
}

export function formatDashboardDate(
	date: Date,
	timeZone: string,
	includeTime = false
) {
	return new Intl.DateTimeFormat("en-US", {
		month: "long",
		day: "numeric",
		year: "numeric",
		timeZone,
		...(includeTime
			? ({ hour: "numeric", minute: "2-digit", timeZoneName: "short" } as const)
			: {})
	}).format(date);
}
