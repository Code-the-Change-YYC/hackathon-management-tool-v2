"use client";

import { ArrowRightLine } from "@mingcute/react";
import Link from "next/link";
import PageHeader from "@/app/components/PageHeader";
import { Schedule } from "@/app/components/Schedule";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardHeader } from "@/app/components/ui/card";
import { useCurrentTime } from "@/hooks/use-current-time";
import {
	type DashboardEvent,
	formatDashboardDate,
	getCurrentEvent,
	getTodayFutureEvents
} from "@/lib/participant-events";
import type { JudgingRound } from "@/lib/participant-judging";
import type { RouterOutputs } from "@/trpc/react";
import { CurrentEventBanner } from "../CurrentEventBanner";
import { JudgingStatus, SubmissionCountdown } from "../ParticipantStatus";

type Settings = RouterOutputs["hackathonSettings"]["get"];

function getDescription(startDate: Date | null, now: Date) {
	if (!startDate) {
		return "Your events, submission deadline, and judging updates in one place.";
	}
	if (now < startDate) {
		return `Get ready to hack, starting on ${formatDashboardDate(startDate)}!`;
	}
	return "Your hackathon at a glance. Happy hacking!";
}

export function DashboardView({
	firstName,
	events,
	settings,
	rounds
}: {
	firstName: string;
	events: DashboardEvent[];
	settings: Settings;
	rounds: JudgingRound[];
}) {
	const now = useCurrentTime();
	const currentEvent = getCurrentEvent(events, now);
	const upcomingEvents = getTodayFutureEvents(events, now);
	const roundName = rounds.find(
		(round) => round.id === settings?.currentRoundId
	)?.name;

	return (
		<div className="flex flex-col gap-6">
			<PageHeader
				description={getDescription(settings?.startDate ?? null, now)}
				title={`Welcome, ${firstName}!`}
			/>
			<CurrentEventBanner colour="red" event={currentEvent} />
			<div className="grid min-w-0 items-start gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
				<Card>
					<CardHeader>
						<div className="flex flex-wrap items-center justify-between gap-1">
							<h2 className="font-medium text-xl">Upcoming Events</h2>
							<Button
								nativeButton={false}
								render={
									<Link href="/participant/schedule">
										View full schedule
										<ArrowRightLine className="size-5" data-icon="inline-end" />
									</Link>
								}
								size="sm"
								variant="ghost"
							/>
						</div>
					</CardHeader>
					<CardContent>
						<Schedule
							emptyDescription="Check back here for new events and activities."
							emptyTitle="No upcoming events"
							items={upcomingEvents.map((event) => ({
								...event,
								eventType: event.type
							}))}
							now={now}
							showGroupLabels={false}
						/>
					</CardContent>
				</Card>
				<Card>
					<CardContent>
						<div className="grid gap-12 sm:grid-cols-2 lg:min-h-89 lg:grid-cols-1 lg:content-between lg:gap-10">
							<SubmissionCountdown
								deadline={settings?.submissionDeadline ?? null}
								startDate={settings?.startDate ?? null}
							/>
							<JudgingStatus
								phase={settings?.judgingPhase ?? "not_started"}
								roundName={roundName}
							/>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
