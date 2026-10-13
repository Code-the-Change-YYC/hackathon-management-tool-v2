import { tz, tzName } from "@date-fns/tz";
import { differenceInSeconds, format, isSameDay } from "date-fns";
import { z } from "zod";
import { formatTime } from "@/lib/datetime";
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
	return events.filter(
		(event) => event.endTime >= now && isSameDay(event.startTime, now)
	);
}

export function countdownParts(deadline: Date, now: Date) {
	const seconds = Math.max(0, differenceInSeconds(deadline, now));
	return [
		Math.floor(seconds / 86400),
		Math.floor(seconds / 3600) % 24,
		Math.floor(seconds / 60) % 60,
		seconds % 60
	] as const;
}

export function formatDashboardDate(
	date: Date,
	timeZone: string,
	includeTime = false
) {
	const formattedDate = format(date, "MMMM d, yyyy", { in: tz(timeZone) });
	if (!includeTime) return formattedDate;
	return `${formattedDate} at ${formatTime(date, timeZone)} ${tzName(timeZone, date, "short")}`;
}
