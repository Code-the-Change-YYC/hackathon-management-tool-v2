"use client";

import { ArrowRightLine } from "@mingcute/react";
import Link from "next/link";
import Banner from "@/app/components/Banner";
import PageHeader from "@/app/components/PageHeader";
import { Schedule } from "@/app/components/Schedule";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardHeader } from "@/app/components/ui/card";
import { useCurrentTime } from "@/hooks/use-current-time";
import type { JudgingPhase } from "@/lib/judging";
import {
	type DashboardEvent,
	eventNavigationUrlSchema,
	formatDashboardDate,
	getCurrentEvent,
	getTodayFutureEvents
} from "@/lib/participant-events";
import { api } from "@/trpc/react";
import CurrentEventImages from "./CurrentEventImages";
import { DataState } from "./DataState";
import { JudgingStatus, SubmissionCountdown } from "./ParticipantStatus";

const refreshOptions = { refetchInterval: 30_000, refetchOnWindowFocus: true };

type DashboardSettings = {
	startDate: Date | null;
	submissionDeadline: Date | null;
	judgingPhase: JudgingPhase;
	timeZone: string;
	currentRoundId: string | null;
};

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

function CurrentEventBanner({
	event,
	timeZone
}: {
	event?: DashboardEvent;
	timeZone: string;
}) {
	if (!event) {
		return (
			<Banner
				buttonText="Navigate there"
				colour="red"
				description="We’re getting the next event ready. Check back soon for schedule details."
				image={<CurrentEventImages />}
				title="Hackathon updates coming soon"
			/>
		);
	}
	const navigationUrl = eventNavigationUrlSchema.safeParse(event.navigationUrl);
	return (
		<Banner
			buttonText="Navigate there"
			colour="red"
			description={event.description}
			endTime={event.endTime}
			href={navigationUrl.success ? navigationUrl.data : undefined}
			image={<CurrentEventImages />}
			location={event.location || "Location to be announced"}
			startTime={event.startTime}
			timeZone={timeZone}
			title={`${event.title} ongoing now!`}
		/>
	);
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
				<CurrentEventBanner event={currentEvent} timeZone={timeZone} />
			)}
			<div className="grid min-w-0 items-start gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
				<Card className="rounded-2xl ring-0">
					<CardHeader>
						<div className="flex flex-wrap items-center justify-between gap-1">
							<h2 className="font-medium text-[22px]/7">Upcoming Events</h2>
							<Button
								className="active:not-aria-[haspopup]:translate-y-0" // Stops button from moving down when clicked
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
