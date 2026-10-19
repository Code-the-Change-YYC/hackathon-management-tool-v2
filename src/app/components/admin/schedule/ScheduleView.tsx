"use client";

import { AddLine, Delete2Line, Edit2Line, More1Line } from "@mingcute/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import {
	ConfirmAlertDialog,
	useConfirmDialog
} from "@/app/components/ConfirmAlertDialog";
import PageHeader from "@/app/components/PageHeader";
import { Schedule } from "@/app/components/Schedule";
import { Button } from "@/app/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger
} from "@/app/components/ui/dropdown-menu";
import { useCurrentTime } from "@/hooks/use-current-time";
import { api } from "@/trpc/react";
import { type AdminEvent, EventDialog } from "./EventDialog";

export function ScheduleView({ events }: { events: AdminEvent[] }) {
	const now = useCurrentTime();
	const router = useRouter();
	const [editing, setEditing] = useState<AdminEvent | "new" | null>(null);
	const { confirm, dialogProps } = useConfirmDialog();
	const deleteEvent = api.events.deleteEvent.useMutation({
		onSuccess: () => {
			toast.success("Event deleted.");
			router.refresh();
		},
		onError: () =>
			toast.error("We couldn’t delete this event. Please try again.")
	});

	async function requestDelete(event: AdminEvent) {
		const confirmed = await confirm({
			title: `Delete ${event.title}?`,
			description:
				"It will be removed from the schedule along with any check-ins. This can’t be undone.",
			confirmLabel: "Delete event",
			destructive: true
		});
		if (confirmed) deleteEvent.mutate({ id: event.id });
	}

	return (
		<div className="flex min-h-svh flex-1 flex-col gap-6 overflow-y-auto bg-white p-6">
			<PageHeader
				description="View all hackathon events and activities"
				title="Schedule"
			/>
			<section
				aria-labelledby="full-schedule-title"
				className="flex flex-col gap-5"
			>
				<div className="flex flex-wrap items-center justify-between gap-3">
					<h2
						className="font-medium text-dark-grey text-lg"
						id="full-schedule-title"
					>
						Full Schedule
					</h2>
					<Button onClick={() => setEditing("new")} size="sm">
						<AddLine data-icon="inline-start" />
						Add event
					</Button>
				</div>
				<Schedule
					actions={(event) => (
						<DropdownMenu>
							<DropdownMenuTrigger
								render={
									<Button
										aria-label={`Manage ${event.title}`}
										className="shrink-0"
										size="icon-sm"
										variant="ghost"
									/>
								}
							>
								<More1Line />
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end" className="w-36">
								<DropdownMenuItem onClick={() => setEditing(event)}>
									<Edit2Line />
									Edit
								</DropdownMenuItem>
								<DropdownMenuItem
									onClick={() => requestDelete(event)}
									variant="destructive"
								>
									<Delete2Line />
									Delete
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					)}
					emptyDescription="Add an event to start building the schedule."
					emptyTitle="No events have been scheduled yet"
					items={events}
					now={now}
				/>
			</section>
			{editing && (
				<EventDialog
					event={editing === "new" ? undefined : editing}
					key={editing === "new" ? "new" : editing.id}
					onClose={() => setEditing(null)}
				/>
			)}
			<ConfirmAlertDialog {...dialogProps} />
		</div>
	);
}
