"use client";

import { ArrowRightLine } from "@mingcute/react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent } from "@/app/components/ui/card";
import {
	ErrorCard,
	JoinMeetingButton,
	LoadingCard,
	PageHeader
} from "./judgeSharedUi";
import {
	type Criterion,
	formatTime,
	getAssignmentRoomName,
	getAssignmentTotal,
	getCriteriaScore,
	getScoreTone,
	getTeamCode,
	isAssignmentScored,
	type JudgeAssignment,
	useJudgePortalData,
	useJudgeUser
} from "./useJudgePortalData";

function RoundStatsCard({
	assigned,
	name,
	remaining,
	scored
}: {
	assigned: number;
	name: string;
	remaining: number;
	scored: number;
}) {
	return (
		<div className="flex flex-col gap-2">
			<h2 className="m-0 font-medium text-[20px] leading-6">{name}</h2>
			<Card className="rounded-2xl border-border shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
				<CardContent className="grid min-h-[96px] grid-cols-3 px-4 py-3">
					<StatNumber label="Assigned" value={assigned} />
					<StatNumber label="Scored" tone="green" value={scored} />
					<StatNumber label="Remaining" tone="red" value={remaining} />
				</CardContent>
			</Card>
		</div>
	);
}

function StatNumber({
	label,
	tone = "default",
	value
}: {
	label: string;
	tone?: "default" | "green" | "red";
	value: number | string;
}) {
	const color =
		tone === "green"
			? "text-[#038b6f]"
			: tone === "red"
				? "text-[#fe3b20]"
				: "text-[#000000]";

	return (
		<div className="flex min-w-0 flex-col items-center justify-center gap-0 text-center">
			<strong className={`font-semibold text-[44px] leading-[52px] ${color}`}>
				{value}
			</strong>
			<span className="font-medium text-[#1a1a1a] text-xs uppercase leading-4">
				{label}
			</span>
		</div>
	);
}

function JudgeTeamCard({
	assignment,
	criteria,
	currentTime,
	roomLabel,
	scoreHref
}: {
	assignment: JudgeAssignment;
	criteria: Criterion[];
	currentTime: Date;
	roomLabel: string;
	scoreHref: string;
}) {
	const scored = isAssignmentScored(assignment, criteria);
	const canScore =
		scored || !assignment.timeSlot || assignment.timeSlot <= currentTime;
	const mainCriteria = criteria.filter((criterion) => !criterion.isSidepot);
	const sidepots = criteria.filter((criterion) => criterion.isSidepot);
	const total = getAssignmentTotal(assignment, criteria);

	return (
		<Card className="flex min-h-[138px] flex-col gap-3 rounded-2xl border-border shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
			<CardContent className="flex flex-1 flex-col gap-3">
				<div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
					<div className="min-w-0">
						<div className="flex flex-wrap items-center gap-2">
							<h3 className="m-0 truncate font-medium text-base text-black">
								{assignment.team.name}
							</h3>
							{scored ? (
								<Link
									aria-label={`Edit score for ${assignment.team.name}`}
									className="rounded-full bg-[#d8f6ee] px-2 py-0.5 font-medium text-[#02644f] text-[11px] transition hover:bg-[#c6f0e5]"
									href={scoreHref}
								>
									Scored
								</Link>
							) : null}
						</div>
						<p className="mt-1 mb-0 text-[#767676] text-[11px]">
							Team ID: {getTeamCode(assignment)}
						</p>
					</div>
					<div className="shrink-0 text-left text-[#767676] text-xs sm:text-right">
						<p className="m-0">
							{formatTime(assignment.timeSlot)}
							{assignment.timeSlot ? " • " : ""}
							{assignment.room.round.name}
						</p>
						<p className="m-0">{roomLabel}</p>
					</div>
				</div>

				{scored ? (
					<div className="flex flex-col gap-3">
						{sidepots.length > 0 ? (
							<div className="flex flex-wrap gap-2">
								{sidepots.map((criterion) => {
									const value = getCriteriaScore(assignment, criterion.id);
									if (value === undefined) return null;
									return (
										<span
											className="inline-flex items-center gap-2 rounded-full bg-[#f7f5ff] px-3 py-1 text-[#1a1a1a] text-[11px]"
											key={criterion.id}
										>
											{criterion.name}
											<span className="rounded-full bg-[#7054fd] px-2 py-0.5 font-medium text-[10px] text-white">
												{value}/{criterion.maxScore}
											</span>
										</span>
									);
								})}
							</div>
						) : null}

						<div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
							{mainCriteria.map((criterion) => {
								const value = getCriteriaScore(assignment, criterion.id) ?? 0;
								return (
									<div
										className={`rounded-xl border px-2 py-2 text-center ${getScoreTone(value, criterion.maxScore)}`}
										key={criterion.id}
									>
										<strong className="block font-semibold text-base leading-5">
											{value}
										</strong>
										<span className="block truncate text-[#292929] text-[9px] uppercase leading-3">
											{criterion.name}
										</span>
									</div>
								);
							})}
							<div className="rounded-xl border border-[#d6d6d6] bg-[#fafafa] px-2 py-2 text-center">
								<strong className="block font-semibold text-base leading-5">
									{total.max ? `${total.total}/${total.max}` : total.total}
								</strong>
								<span className="block text-[#434343] text-[9px] uppercase leading-3">
									Total
								</span>
							</div>
						</div>
					</div>
				) : null}

				{scored ? null : (
					<div className="mt-auto flex justify-end">
						{canScore ? (
							<Button render={<Link href={scoreHref} />} size="sm">
								Score team
								<ArrowRightLine data-icon="inline-end" />
							</Button>
						) : (
							<Button disabled size="sm" type="button" variant="secondary">
								Score team
								<ArrowRightLine data-icon="inline-end" />
							</Button>
						)}
					</div>
				)}
			</CardContent>
		</Card>
	);
}

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

export function JudgeDashboardPage() {
	const { userName } = useJudgeUser();
	const data = useJudgePortalData();
	const currentTime = useCurrentTime();

	const roundStats = useMemo(() => {
		const roundsById = new Map(
			data.rounds.map((round) => [round.id, round] as const)
		);
		for (const assignment of data.assignments) {
			roundsById.set(assignment.room.round.id, assignment.room.round);
		}

		const grouped = new Map<string, JudgeAssignment[]>();
		for (const assignment of data.assignments) {
			const roundId = assignment.room.round.id;
			grouped.set(roundId, [...(grouped.get(roundId) ?? []), assignment]);
		}

		return Array.from(grouped.entries())
			.map(([roundId, assignments]) => {
				const round = roundsById.get(roundId);
				const scored = assignments.filter((assignment) =>
					isAssignmentScored(assignment, data.criteria)
				).length;
				return {
					assigned: assignments.length,
					id: roundId,
					isActive: data.activeRoundId === roundId,
					name: round?.name ?? "Judging round",
					remaining: assignments.length - scored,
					scored,
					startTime: round?.startTime?.getTime() ?? 0
				};
			})
			.sort(
				(a, b) =>
					Number(b.isActive) - Number(a.isActive) || a.startTime - b.startTime
			);
	}, [data.activeRoundId, data.assignments, data.criteria, data.rounds]);
	const dashboardRoundId =
		roundStats.find((round) => round.isActive)?.id ?? roundStats[0]?.id ?? "";
	const dashboardAssignments = dashboardRoundId
		? data.assignments.filter(
				(assignment) => assignment.room.round.id === dashboardRoundId
			)
		: data.assignments;
	const dashboardRoundName =
		roundStats.find((round) => round.id === dashboardRoundId)?.name ?? "";

	if (data.error) {
		return (
			<ErrorCard
				message={`Judging data could not be loaded: ${data.error.message}`}
			/>
		);
	}

	return (
		<div className="flex flex-col gap-6">
			<PageHeader
				description="Manage and score your assigned teams."
				title={
					<>
						Hi, <span className="text-[#f70c55]">{userName}</span>!
					</>
				}
			>
				<div className="flex flex-col items-start gap-1 sm:items-end">
					<p className="m-0 font-medium text-base">{data.roomSummary}</p>
					<JoinMeetingButton href={data.firstMeetingLink} />
				</div>
			</PageHeader>

			{data.isLoading ? (
				<LoadingCard />
			) : (
				<>
					{roundStats.length > 0 ? (
						<section className="grid gap-4 xl:grid-cols-2">
							{roundStats.map((round) => (
								<RoundStatsCard
									assigned={round.assigned}
									key={round.id}
									name={round.name}
									remaining={round.remaining}
									scored={round.scored}
								/>
							))}
						</section>
					) : null}

					<section className="flex flex-col gap-4">
						<h2 className="m-0 font-medium text-[22px] leading-7">
							{dashboardRoundName ? `Teams · ${dashboardRoundName}` : "Teams"}
						</h2>
						{dashboardAssignments.length > 0 ? (
							<div className="grid gap-4 xl:grid-cols-2">
								{dashboardAssignments.map((assignment) => (
									<JudgeTeamCard
										assignment={assignment}
										criteria={data.criteria}
										currentTime={currentTime}
										key={assignment.id}
										roomLabel={
											data.roomLabels.get(assignment.room.id) ??
											getAssignmentRoomName(assignment)
										}
										scoreHref={`/judge/score/${assignment.id}`}
									/>
								))}
							</div>
						) : (
							<div className="rounded-2xl border border-[#d6d6d6] border-dashed p-8 text-center text-[#575757]">
								No teams have been assigned to you yet.
							</div>
						)}
					</section>
				</>
			)}
		</div>
	);
}
