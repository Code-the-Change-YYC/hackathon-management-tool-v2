"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/app/components/ui/card";
import { ErrorCard, LoadingCard, PageHeader } from "./judgeSharedUi";
import {
	type Criterion,
	formatDate,
	formatDuration,
	formatTime,
	getAssignmentRoomName,
	getAssignmentTotal,
	getTeamCode,
	isAssignmentScored,
	type JudgeAssignment,
	sortAssignments,
	useJudgePortalData
} from "./useJudgePortalData";

function useCurrentTime() {
	const [currentTime, setCurrentTime] = useState(() => new Date());

	useEffect(() => {
		const interval = window.setInterval(
			() => setCurrentTime(new Date()),
			30_000
		);
		return () => window.clearInterval(interval);
	}, []);

	return currentTime;
}

function inferDuration(
	assignment: JudgeAssignment,
	assignments: JudgeAssignment[]
) {
	const assignmentTime = assignment.timeSlot;
	if (!assignmentTime) return 20;
	const nextAssignment = assignments
		.filter(
			(candidate) =>
				candidate.room.id === assignment.room.id &&
				candidate.timeSlot &&
				candidate.timeSlot > assignmentTime
		)
		.sort(sortAssignments)[0];

	if (!nextAssignment?.timeSlot) return 20;
	const minutes = Math.round(
		(nextAssignment.timeSlot.getTime() - assignmentTime.getTime()) / 60_000
	);
	if (minutes <= 0 || minutes > 120) return 20;
	return minutes;
}

function ScheduleEventCard({
	assignment,
	criteria,
	duration,
	roomLabel,
	scoreHref
}: {
	assignment: JudgeAssignment;
	criteria: Criterion[];
	duration: number;
	roomLabel: string;
	scoreHref: string;
}) {
	const scored = isAssignmentScored(assignment, criteria);
	const total = getAssignmentTotal(assignment, criteria);

	return (
		<Link
			className="group w-full rounded-2xl border border-[#d6d6d6] bg-white p-4 text-left shadow-[0_1px_3px_rgba(0,0,0,0.06)] transition hover:border-[#7054fd] hover:bg-[#f7f5ff]"
			href={scoreHref}
		>
			<div className="flex gap-4">
				<div className="hidden w-[68px] shrink-0 flex-col items-end border-[#d6d6d6] border-r pr-4 text-right sm:flex">
					<span
						className={`rounded-full px-2 py-0.5 font-medium text-[11px] ${
							scored
								? "bg-[#d8f6ee] text-[#02644f]"
								: "bg-[#eae6ff] text-[#2911a7]"
						}`}
					>
						{scored ? "Scored" : "Open"}
					</span>
					<span className="mt-2 text-[#767676] text-[11px]">
						{formatTime(assignment.timeSlot)}
					</span>
				</div>
				<div className="min-w-0 flex-1">
					<h3 className="m-0 truncate font-medium text-[#292929] text-lg">
						{assignment.team.name}
					</h3>
					<div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[#575757] text-xs">
						<span>Team ID: {getTeamCode(assignment)}</span>
						<span>{formatDuration(duration)}</span>
						<span>{roomLabel}</span>
					</div>
				</div>
				{scored ? (
					<div className="hidden shrink-0 text-right md:block">
						<span className="rounded-full bg-[#d8f6ee] px-3 py-1 font-medium text-[#02644f] text-xs">
							Scored
						</span>
						<p className="mt-2 mb-0 font-medium text-[22px] leading-7">
							{total.max ? `${total.total}/${total.max}` : total.total}
						</p>
					</div>
				) : null}
			</div>
		</Link>
	);
}

export function JudgeSchedulePage() {
	const data = useJudgePortalData();
	const currentTime = useCurrentTime();

	const scheduledAssignments = useMemo(
		() =>
			data.assignments
				.filter((assignment) => assignment.timeSlot)
				.slice()
				.sort(sortAssignments),
		[data.assignments]
	);
	const assignmentsByDate = useMemo(() => {
		const groups = new Map<string, JudgeAssignment[]>();
		for (const assignment of scheduledAssignments) {
			const key = assignment.timeSlot?.toDateString() ?? "unscheduled";
			groups.set(key, [...(groups.get(key) ?? []), assignment]);
		}
		return Array.from(groups.values());
	}, [scheduledAssignments]);

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
			) : scheduledAssignments.length > 0 ? (
				<div className="flex flex-col gap-8">
					{assignmentsByDate.map((group) => (
						<section className="flex flex-col gap-3" key={group[0]?.id}>
							<h2 className="m-0 font-medium text-base">
								{formatDate(group[0]?.timeSlot)}
							</h2>
							<div className="relative rounded-2xl bg-[#fcfcfc] pl-0 sm:pl-6">
								<div className="absolute top-3 bottom-3 left-3 hidden w-1 rounded-full bg-[#7054fd] sm:block" />
								<div className="flex flex-col gap-4">
									{group.map((assignment) => (
										<div
											className="grid gap-2 sm:grid-cols-[64px_1fr] sm:gap-4"
											key={assignment.id}
										>
											<div className="font-medium text-[#575757] text-sm sm:pt-2 sm:text-right">
												{formatTime(assignment.timeSlot)}
											</div>
											<ScheduleEventCard
												assignment={assignment}
												criteria={data.criteria}
												duration={inferDuration(
													assignment,
													scheduledAssignments
												)}
												roomLabel={
													data.roomLabels.get(assignment.room.id) ??
													getAssignmentRoomName(assignment)
												}
												scoreHref={`/judge/score/${assignment.id}`}
											/>
										</div>
									))}
								</div>
							</div>
						</section>
					))}
				</div>
			) : (
				<div className="rounded-2xl border border-[#d6d6d6] border-dashed p-8 text-center text-[#575757]">
					No scheduled judging assignments yet.
				</div>
			)}
		</div>
	);
}
