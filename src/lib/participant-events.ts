import { differenceInSeconds } from "date-fns";
import { z } from "zod";
import { formatFullDate, formatTime, isSameCalgaryDay } from "@/lib/datetime";
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

export function hasHackathonStarted(startDate: Date | null | undefined) {
	return startDate != null && Date.now() >= startDate.getTime();
}

export function getCurrentEvent(events: DashboardEvent[], now: Date) {
	return events.find((event) => event.startTime <= now && now < event.endTime);
}

export function getTodayFutureEvents(events: DashboardEvent[], now: Date) {
	return events.filter(
		(event) => event.endTime >= now && isSameCalgaryDay(event.startTime, now)
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

export function formatDashboardDate(date: Date, includeTime = false) {
	const formattedDate = formatFullDate(date);
	if (!includeTime) return formattedDate;
	return `${formattedDate} at ${formatTime(date)}`;
}
