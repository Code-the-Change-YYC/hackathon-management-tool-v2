"use client";

import { ArrowRightLine } from "@mingcute/react";
import Link from "next/link";
import PageHeader from "@/app/components/PageHeader";
import { Schedule } from "@/app/components/Schedule";
import { buttonVariants } from "@/app/components/ui/button";
import { Card, CardContent, CardHeader } from "@/app/components/ui/card";
import { useCurrentTime } from "@/hooks/use-current-time";
import {
	type DashboardEvent,
	formatDashboardDate,
	getCurrentEvent,
	getTodayFutureEvents
} from "@/lib/participant-events";
import { cn } from "@/lib/utils";
import { api, type RouterOutputs } from "@/trpc/react";
import { CurrentEventBanner } from "./CurrentEventBanner";
import { DataState } from "./DataState";
import { JudgingStatus, SubmissionCountdown } from "./ParticipantStatus";

const refreshOptions = { refetchInterval: 30_000, refetchOnWindowFocus: true };

type DashboardSettings = NonNullable<RouterOutputs["hackathonSettings"]["get"]>;

export function ParticipantDashboard({ firstName }: { firstName: string }) {
	const events = api.events.getActiveEvents.useQuery(undefined, refreshOptions);
	const settings = api.hackathonSettings.get.useQuery(
		undefined,
		refreshOptions
	);
	const rounds = api.judgingRounds.getAll.useQuery(undefined, refreshOptions);
	return (
		<DashboardView
			events={events.data ?? []}
			eventsError={events.isError}
			eventsLoading={events.isPending}
			firstName={firstName}
			retryEvents={() => void events.refetch()}
			retrySettings={() => void settings.refetch()}
			roundName={
				rounds.data?.find((round) => round.id === settings.data?.currentRoundId)
					?.name
			}
			settings={settings.data ?? null}
			settingsError={settings.isError}
			settingsLoading={settings.isPending}
		/>
	);
}

function getDashboardDescription(
	startDate: Date | null,
	now: Date,
	timeZone: string
) {
	if (!startDate) {
		return "Your events, submission deadline, and judging updates in one place.";
	}
	if (now < startDate) {
		return `Get ready to hack, starting on ${formatDashboardDate(startDate, timeZone)}!`;
	}
	return "Your hackathon at a glance. Happy hacking!";
}

// Separate view keeps data fetching out of reusable presentation components.
export function DashboardView({
	firstName,
	events,
	settings,
	roundName,
	eventsLoading = false,
	settingsLoading = false,
	eventsError = false,
	settingsError = false,
	retryEvents = () => {},
	retrySettings = () => {}
}: {
	firstName: string;
	events: DashboardEvent[];
	settings: DashboardSettings | null;
	roundName?: string;
	eventsLoading?: boolean;
	settingsLoading?: boolean;
	eventsError?: boolean;
	settingsError?: boolean;
	retryEvents?: () => void;
	retrySettings?: () => void;
}) {
	const now = useCurrentTime();
	const currentEvent = getCurrentEvent(events, now);
	const upcomingEvents = getTodayFutureEvents(events, now);
	const timeZone = settings?.timeZone ?? "America/Edmonton";
	const description = getDashboardDescription(
		settings?.startDate ?? null,
		now,
		timeZone
	);
	return (
		<div className="flex flex-col gap-6">
			<PageHeader description={description} title={`Welcome, ${firstName}!`} />
			{!eventsError && !eventsLoading && (
				<CurrentEventBanner
					colour="red"
					event={currentEvent}
					timeZone={timeZone}
				/>
			)}
			<div className="grid min-w-0 items-start gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
				<Card className="rounded-2xl ring-0">
					<CardHeader>
						<div className="flex flex-wrap items-center justify-between gap-1">
							<h2 className="font-medium text-[22px]/7">Upcoming Events</h2>
							<Link
								className={cn(
									buttonVariants({ size: "sm", variant: "ghost" }),
									"active:not-aria-[haspopup]:translate-y-0"
								)}
								href="/participant/schedule"
							>
								View full schedule
								<ArrowRightLine className="size-5" data-icon="inline-end" />
							</Link>
						</div>
					</CardHeader>
					<CardContent>
						<DataState
							error={eventsError}
							loading={eventsLoading}
							retry={retryEvents}
						>
							<Schedule
								emptyDescription="Check back here for new events and activities."
								emptyTitle="No upcoming events"
								items={upcomingEvents.map((event) => ({
									...event,
									eventType: event.type
								}))}
								now={now}
								showGroupLabels={false}
								timeZone={timeZone}
							/>
						</DataState>
					</CardContent>
				</Card>
				<Card className="rounded-2xl ring-0">
					<CardContent>
						<DataState
							error={settingsError}
							loading={settingsLoading}
							retry={retrySettings}
						>
							<div className="grid gap-12 sm:grid-cols-2 lg:min-h-89 lg:grid-cols-1 lg:content-between lg:gap-10">
								<SubmissionCountdown
									deadline={settings?.submissionDeadline ?? null}
									startDate={settings?.startDate ?? null}
									timeZone={timeZone}
								/>
								<JudgingStatus
									phase={settings?.judgingPhase ?? "not_started"}
									roundName={roundName}
								/>
							</div>
						</DataState>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
