"use client";

import PageHeader from "@/app/components/PageHeader";
import { Schedule } from "@/app/components/Schedule";
import { Card, CardContent } from "@/app/components/ui/card";
import { useCurrentTime } from "@/hooks/use-current-time";
import { type DashboardEvent, getCurrentEvent } from "@/lib/participant-events";
import { api } from "@/trpc/react";
import { CurrentEventBanner } from "./CurrentEventBanner";
import { DataState } from "./DataState";

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
		/>
	);
}

// Separate view keeps data fetching out of reusable presentation components.
export function ScheduleView({
	events,
	loading = false,
	error = false,
	retry = () => {}
}: {
	events: DashboardEvent[];
	loading?: boolean;
	error?: boolean;
	retry?: () => void;
}) {
	const now = useCurrentTime();
	const currentEvent = getCurrentEvent(events, now);
	return (
		<div className="flex flex-col gap-6">
			<PageHeader
				description="View all hackathon events and activities"
				title="Schedule"
			/>
			{!error && !loading && (
				<CurrentEventBanner colour="purple" event={currentEvent} />
			)}
			<Card>
				<CardContent>
					<DataState
						error={error}
						label="Loading schedule"
						loading={loading}
						retry={retry}
					>
						<Schedule
							emptyDescription="Check back soon for hackathon events and activities."
							emptyTitle="No events have been scheduled yet."
							items={events.map((event) => ({
								...event,
								eventType: event.type
							}))}
							now={now}
						/>
					</DataState>
				</CardContent>
			</Card>
		</div>
	);
}
