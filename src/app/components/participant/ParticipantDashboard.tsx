"use client";

import { ArrowRightLine } from "@mingcute/react";
import Image from "next/image";
import Link from "next/link";
import PageHeader from "@/app/components/PageHeader";
import { ScheduleItem } from "@/app/components/ScheduleItem";
import { buttonVariants } from "@/app/components/ui/button";
import { Card, CardContent, CardHeader } from "@/app/components/ui/card";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyTitle
} from "@/app/components/ui/empty";
import { useCurrentTime } from "@/hooks/use-current-time";
import {
	type DashboardEvent,
	formatDashboardDate,
	type JudgingPhase,
	selectDashboardEvents
} from "@/lib/participant-events";
import { api } from "@/trpc/react";
import { DataState } from "./DataState";
import { EventBanner } from "./EventBanner";
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
	const { current, upcoming } = selectDashboardEvents(events, now);
	const timeZone = settings?.timeZone ?? "America/Edmonton";
	const description = settings?.startDate
		? now < settings.startDate
			? `Get ready to hack, starting on ${formatDashboardDate(settings.startDate, timeZone)}!`
			: "Your hackathon at a glance. Happy hacking!"
		: "Your events, submission deadline, and judging updates in one place.";
	return (
		<main className="relative isolate min-h-svh overflow-hidden bg-grey-50 px-4 py-6 text-grey-800 md:px-8 lg:px-6">
			<Image
				alt=""
				aria-hidden
				className="-z-10 pointer-events-none absolute top-[-72px] right-[-340px] max-w-none sm:right-[-140px] lg:right-0"
				height={248.691}
				loading="eager"
				src="/images/participant-dashboard/decoration.svg"
				width={561.009}
			/>
			<div className="mx-auto flex max-w-7xl flex-col gap-6">
				<PageHeader
					description={description}
					title={`Welcome, ${firstName}!`}
					variant="dashboard"
				/>
				{!eventsError && !eventsLoading && (
					<EventBanner event={current} timeZone={timeZone} />
				)}
				<div className="grid min-w-0 items-start gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
					<Card variant="dashboard">
						<CardHeader>
							<div className="flex flex-wrap items-center justify-between gap-1">
								<h2 className="font-medium text-[22px]/7">Upcoming Events</h2>
								<Link
									className={buttonVariants({
										variant: "ghost",
										size: "dashboard"
									})}
									href="/participant/schedule"
								>
									View full schedule
									<ArrowRightLine data-icon="inline-end" />
								</Link>
							</div>
						</CardHeader>
						<CardContent>
							<DataState
								error={eventsError}
								loading={eventsLoading}
								retry={retryEvents}
							>
								{upcoming.length ? (
									<ol className="flex flex-col gap-6 rounded-sm border-grey-400 border-l-4 pl-3">
										{upcoming.map((event) => (
											<ScheduleItem
												item={{ ...event, eventType: event.type }}
												key={event.id}
												now={now}
												timeZone={timeZone}
												variant="compact"
											/>
										))}
									</ol>
								) : (
									<Empty>
										<EmptyHeader>
											<EmptyTitle>No upcoming events</EmptyTitle>
											<EmptyDescription>
												Check back here for new events and activities.
											</EmptyDescription>
										</EmptyHeader>
									</Empty>
								)}
							</DataState>
						</CardContent>
					</Card>
					<Card variant="dashboard">
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
		</main>
	);
}
