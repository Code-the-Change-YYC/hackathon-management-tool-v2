import { z } from "zod";
import type { EventType } from "@/types/types";

// Explicitly controlled by organizers; time alone never advances judging.
export const JUDGING_PHASES = [
	"not_started",
	"submissions_closed",
	"review",
	"judging",
	"deliberation",
	"results_ready",
	"winners_announced"
] as const;
export type JudgingPhase = (typeof JUDGING_PHASES)[number];
export const JUDGING_PHASE_LABELS: Record<JudgingPhase, string> = {
	not_started: "Judging has not started",
	submissions_closed: "Submissions close",
	review: "Submission review",
	judging: "Judging",
	deliberation: "Deliberation",
	results_ready: "Results ready",
	winners_announced: "Winners announced"
};

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

export function selectDashboardEvents(events: DashboardEvent[], now: Date) {
	const sorted = [...events].sort(
		(a, b) =>
			a.startTime.getTime() - b.startTime.getTime() || a.id.localeCompare(b.id)
	);
	return {
		current: sorted.find(
			(event) => event.startTime <= now && now < event.endTime
		),
		upcoming: sorted.filter((event) => event.startTime > now).slice(0, 3)
	};
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
