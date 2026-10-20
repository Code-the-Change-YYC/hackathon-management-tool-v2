"use client";

import PageHeader from "@/app/components/PageHeader";
import { Card, CardContent } from "@/app/components/ui/card";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyTitle
} from "@/app/components/ui/empty";
import { useCurrentTime } from "@/hooks/use-current-time";
import {
	type Criterion,
	formatDate,
	formatTime,
	getRoomName,
	type JudgeAssignment
} from "../judgePortal";
import { JudgeScheduleEvent } from "./JudgeScheduleEvent";
import { groupScheduleByDate, inferDuration } from "./judgeSchedule";

export function ScheduleView({
	assignments,
	criteria
}: {
	assignments: JudgeAssignment[];
	criteria: Criterion[];
}) {
	const currentTime = useCurrentTime();
	const assignmentsByDate = groupScheduleByDate(assignments);

	return (
		<div className="flex flex-col gap-6">
			<PageHeader
				description="View your assigned time slots."
				title="Judging Schedule"
			/>

			<Card>
				<CardContent className="flex items-center justify-between">
					<div>
						<p className="m-0 text-muted-foreground text-xs">Current time</p>
						<p className="m-0 font-medium text-xl">{formatTime(currentTime)}</p>
					</div>
					<div className="text-right">
						<p className="m-0 text-muted-foreground text-xs">Room assignment</p>
						<p className="m-0 font-medium text-base">
							{getRoomName(assignments) ?? "No room"}
						</p>
					</div>
				</CardContent>
			</Card>

			{assignmentsByDate.length > 0 ? (
				<div className="flex flex-col gap-8">
					{assignmentsByDate.map((group) => (
						<section className="flex flex-col gap-3" key={group[0]?.id}>
							<h2 className="m-0 font-medium text-base">
								{formatDate(group[0]?.timeSlot)}
							</h2>
							<div className="relative pl-0 sm:pl-6">
								<div className="absolute top-3 bottom-3 left-3 hidden w-1 rounded-full bg-border sm:block" />
								<div className="flex flex-col gap-4">
									{group.map((assignment) => (
										<div
											className="grid gap-2 sm:grid-cols-[64px_1fr] sm:gap-4"
											key={assignment.id}
										>
											<div className="font-medium text-muted-foreground text-sm sm:pt-2 sm:text-right">
												{formatTime(assignment.timeSlot)}
											</div>
											<JudgeScheduleEvent
												assignment={assignment}
												criteria={criteria}
												currentTime={currentTime}
												duration={inferDuration(assignment, assignments)}
											/>
										</div>
									))}
								</div>
							</div>
						</section>
					))}
				</div>
			) : (
				<Empty className="border">
					<EmptyHeader>
						<EmptyTitle>No judging assignments yet</EmptyTitle>
						<EmptyDescription>
							Your time slots will appear here once the schedule is set.
						</EmptyDescription>
					</EmptyHeader>
				</Empty>
			)}
		</div>
	);
}
