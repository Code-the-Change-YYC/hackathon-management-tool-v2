"use client";

import PageHeader from "@/app/components/PageHeader";
import { ScheduleSection } from "@/app/components/ScheduleSection";
import { useCurrentTime } from "@/hooks/use-current-time";
import {
	type DashboardEvent,
	selectDashboardEvents
} from "@/lib/participant-events";
import { api } from "@/trpc/react";
import { DataState } from "./DataState";
import { EventBanner } from "./EventBanner";

const refreshOptions = { refetchInterval: 30_000, refetchOnWindowFocus: true };

export function ParticipantSchedule() {
	const events = api.events.getActiveEvents.useQuery(undefined, refreshOptions);
	const settings = api.hackathonSettings.get.useQuery(
		undefined,
		refreshOptions
	);
	return (
		<ScheduleView
			error={events.isError || settings.isError}
			events={events.data ?? []}
			loading={events.isPending || settings.isPending}
			retry={() => {
				void events.refetch();
				void settings.refetch();
			}}
			timeZone={settings.data?.timeZone ?? "America/Edmonton"}
		/>
	);
}

export function ScheduleView({
	events,
	timeZone,
	loading = false,
	error = false,
	retry = () => {}
}: {
	events: DashboardEvent[];
	timeZone: string;
	loading?: boolean;
	error?: boolean;
	retry?: () => void;
}) {
	const now = useCurrentTime();
	const { current } = selectDashboardEvents(events, now);
	return (
		<main className="min-h-svh bg-grey-50 px-4 py-6 text-grey-800 md:px-8 xl:px-6">
			<div className="mx-auto flex max-w-7xl flex-col gap-6">
				<PageHeader
					description="View all hackathon events and activities"
					title="Schedule"
					variant="schedule"
				/>
				<div className="flex flex-col gap-16">
					<section
						aria-labelledby="happening-now"
						className="flex flex-col gap-4"
					>
						<h2 className="font-medium text-[22px]/7" id="happening-now">
							Happening now
						</h2>
						<EventBanner
							event={loading || error ? undefined : current}
							timeZone={timeZone}
							tone="purple"
						/>
					</section>
					<DataState
						error={error}
						label="Loading schedule"
						loading={loading}
						retry={retry}
					>
						<ScheduleSection
							emptyDescription="Check back soon for hackathon events and activities."
							emptyTitle="No events have been scheduled yet."
							items={events.map((event) => ({
								...event,
								eventType: event.type
							}))}
							now={now}
							timeZone={timeZone}
							title="Full Schedule"
							variant="timeline"
						/>
					</DataState>
				</div>
			</div>
		</main>
	);
}
