"use client";

import { useMemo } from "react";
import PageHeader from "@/app/components/PageHeader";
import { Card, CardContent } from "@/app/components/ui/card";
import { useCurrentTime } from "@/hooks/use-current-time";
import { ErrorCard } from "./ErrorCard";
import { JudgeScheduleEvent } from "./JudgeScheduleEvent";
import { formatDate, formatTime } from "./judgePortal";
import { groupScheduleByDate, inferDuration } from "./judgeSchedule";
import { LoadingCard } from "./LoadingCard";
import { useJudgePortalData } from "./useJudgePortalData";

export function JudgeSchedulePage() {
	const data = useJudgePortalData();
	const currentTime = useCurrentTime();

	const assignmentsByDate = useMemo(
		() => groupScheduleByDate(data.assignments),
		[data.assignments]
	);

	if (data.error) {
		return (
			<ErrorCard
				message={`Schedule could not be loaded: ${data.error.message}`}
			/>
		);
	}

	return (
		<div className="flex flex-col gap-6">
			<PageHeader
				description="View your assigned time slots."
				title="Judging Schedule"
			/>

			<Card className="rounded-2xl border-border shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
				<CardContent className="flex items-center justify-between px-4 py-3">
					<div>
						<p className="m-0 text-muted-foreground text-xs">Current time</p>
						<p className="m-0 font-medium text-[22px] leading-7">
							{formatTime(currentTime)}
						</p>
					</div>
					<div className="text-right">
						<p className="m-0 text-muted-foreground text-xs">Room assignment</p>
						<p className="m-0 font-medium text-base">{data.roomLabelSummary}</p>
					</div>
				</CardContent>
			</Card>

			{data.isLoading ? (
				<LoadingCard label="Loading schedule…" />
			) : assignmentsByDate.length > 0 ? (
				<div className="flex flex-col gap-8">
					{assignmentsByDate.map((group) => (
						<section className="flex flex-col gap-3" key={group[0]?.id}>
							<h2 className="m-0 font-medium text-base">
								{formatDate(group[0]?.timeSlot)}
							</h2>
							<div className="relative rounded-2xl bg-background pl-0 sm:pl-6">
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
												criteria={data.criteria}
												currentTime={currentTime}
												duration={inferDuration(assignment, data.assignments)}
											/>
										</div>
									))}
								</div>
							</div>
						</section>
					))}
				</div>
			) : (
				<div className="rounded-2xl border border-border border-dashed p-8 text-center text-muted-foreground">
					No scheduled judging assignments yet.
				</div>
			)}
		</div>
	);
}
