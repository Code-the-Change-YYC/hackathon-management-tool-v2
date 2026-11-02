"use client";

import {
	ArrowRightLine,
	Calendar2Line,
	CheckLine,
	CloseLine,
	InformationLine,
	TimeLine,
	TrophyLine
} from "@mingcute/react";
import Link from "next/link";
import type { ReactNode } from "react";
import { buttonVariants } from "@/app/components/ui/button";
import { Card, CardContent, CardHeader } from "@/app/components/ui/card";
import { Skeleton } from "@/app/components/ui/skeleton";
import {
	describeJudgingSchedule,
	type JudgingProgress,
	presentationsEnd,
	type TeamJudgingRound,
	type TeamJudgingStatus
} from "@/lib/participant-judging";
import { cn, range } from "@/lib/utils";

type Tone = "done" | "waiting" | "scheduled" | "finalist" | "failed" | "info";

const TONES: Record<Tone, { icon: typeof CheckLine; className: string }> = {
	done: { icon: CheckLine, className: "bg-primary/10 text-primary" },
	waiting: { icon: TimeLine, className: "bg-grey-100 text-grey-600" },
	scheduled: { icon: Calendar2Line, className: "bg-primary/10 text-primary" },
	finalist: { icon: TrophyLine, className: "bg-primary text-white" },
	failed: { icon: CloseLine, className: "bg-red-50 text-red-600" },
	info: { icon: InformationLine, className: "bg-grey-100 text-grey-600" }
};

type StatusItem = {
	id: string;
	tone: Tone;
	title: string;
	description: string;
	children?: ReactNode;
};

function prescreenItem(
	team: NonNullable<TeamJudgingStatus["team"]>,
	submissionsClosed: boolean
): StatusItem {
	if (team.prescreen === "passed")
		return {
			id: "prescreen",
			tone: "done",
			title: "Passed pre-screening",
			description:
				"Your project meets the submission requirements and moves on to judging."
		};
	if (team.prescreen === "failed")
		return {
			id: "prescreen",
			tone: "failed",
			title: "Didn’t pass pre-screening",
			description: "Your project won’t move on to judging.",
			children: team.feedback && (
				<div className="mt-2 flex flex-col gap-1 rounded-lg bg-grey-50 p-3">
					<span className="font-medium text-grey-600 text-xs/4">
						Feedback from the organizers
					</span>
					<p className="whitespace-pre-line text-sm/5">{team.feedback}</p>
				</div>
			)
		};
	return submissionsClosed
		? {
				id: "prescreen",
				tone: "waiting",
				title: "Pre-screening in progress",
				description:
					"Organizers are checking your project against the submission requirements."
			}
		: {
				id: "prescreen",
				tone: "waiting",
				title: "Pre-screening",
				description: "Your project is pre-screened once submissions close."
			};
}

function panelRoundItem(
	judging: TeamJudgingRound & { scored: boolean },
	now: Date
): StatusItem {
	const { round } = judging;
	const end = presentationsEnd(judging);
	if (end && now < end)
		return {
			id: round.id,
			tone: "scheduled",
			title: `${round.name}: your presentations`,
			description: describeJudgingSchedule(judging)
		};
	return judging.scored
		? {
				id: round.id,
				tone: "done",
				title: `Scored in ${round.name}`,
				description:
					"Every judge at your tables has scored your project. Scores are shared once winners are announced."
			}
		: {
				id: round.id,
				tone: "waiting",
				title: `${round.name}: scoring in progress`,
				description: "The judges are finishing your team’s scores."
			};
}

function finalRoundItem(
	judging: TeamJudgingRound & { scored: boolean },
	now: Date
): StatusItem {
	const end = presentationsEnd(judging);
	const description =
		end && now < end
			? describeJudgingSchedule(judging)
			: judging.scored
				? "The judges have scored your final presentation. Winners are announced at the closing ceremony."
				: "The judges are scoring your final presentation.";
	return {
		id: judging.round.id,
		tone: "finalist",
		title: "You’re a finalist!",
		description
	};
}

function teamStatusItems(
	{ team, rounds, finalPublished }: TeamJudgingStatus,
	submissionsClosed: boolean,
	now: Date
): StatusItem[] {
	if (!team)
		return [
			{
				id: "team",
				tone: "info",
				title: "You’re not on a team yet",
				description: "Join or create a team to take part in judging.",
				children: (
					<Link
						className={cn(
							buttonVariants({ size: "sm", variant: "outline" }),
							"mt-2 w-fit"
						)}
						href="/participant/team"
					>
						Go to your team
						<ArrowRightLine className="size-5" data-icon="inline-end" />
					</Link>
				)
			}
		];

	const items = [prescreenItem(team, submissionsClosed)];
	if (team.prescreen !== "passed") return items;

	const panelRounds = rounds.filter((entry) => entry.round.kind !== "final");
	const finalRound = rounds.find((entry) => entry.round.kind === "final");
	if (panelRounds.length === 0)
		items.push({
			id: "schedule",
			tone: "waiting",
			title: "Judging schedule coming soon",
			description:
				"Your presentation times will appear here once they’re published."
		});
	items.push(...panelRounds.map((entry) => panelRoundItem(entry, now)));

	if (finalRound) items.push(finalRoundItem(finalRound, now));
	else if (finalPublished)
		items.push({
			id: "final",
			tone: "info",
			title: "Not selected for the final round",
			description:
				"Your team wasn’t selected as a finalist this time. Thanks for presenting!"
		});
	else if (panelRounds.length > 0 && panelRounds.every((entry) => entry.scored))
		items.push({
			id: "final",
			tone: "waiting",
			title: "Finalists coming soon",
			description: "Finalists are announced once every team has been scored."
		});
	return items;
}

export function TeamJudgingCard({
	status,
	progress,
	now
}: {
	status: TeamJudgingStatus;
	progress: JudgingProgress;
	now: Date;
}) {
	const { submissionDeadline } = progress;
	const submissionsClosed =
		submissionDeadline !== null && submissionDeadline <= now;
	const items = teamStatusItems(status, submissionsClosed, now);

	return (
		<Card className="min-w-0">
			<CardHeader>
				<h2 className="font-medium text-xl">Your Team</h2>
				{status.team && (
					<p className="text-grey-600 text-sm/5">{status.team.name}</p>
				)}
			</CardHeader>
			<CardContent>
				<ul aria-live="polite" className="flex flex-col gap-6">
					{items.map((item) => {
						const { icon: Icon, className } = TONES[item.tone];
						return (
							<li className="flex gap-4" key={item.id}>
								<span
									className={cn(
										"flex size-10 shrink-0 items-center justify-center rounded-full",
										className
									)}
								>
									<Icon aria-hidden className="size-5" />
								</span>
								<div className="flex min-w-0 flex-1 flex-col gap-1 pt-0.5">
									<span className="font-medium text-base/6">{item.title}</span>
									<p className="text-grey-600 text-sm/5">{item.description}</p>
									{item.children}
								</div>
							</li>
						);
					})}
				</ul>
			</CardContent>
		</Card>
	);
}

export function TeamJudgingCardSkeleton() {
	return (
		<Card className="min-w-0">
			<CardHeader>
				<h2 className="font-medium text-xl">Your Team</h2>
				<Skeleton className="my-1 h-3 w-32" />
			</CardHeader>
			<CardContent className="flex flex-col gap-6">
				{range(2).map((index) => (
					<div className="flex gap-4" key={index}>
						<Skeleton className="size-10 shrink-0 rounded-full" />
						<div className="flex min-w-0 flex-1 flex-col gap-1 pt-0.5">
							<Skeleton className="my-1 h-4 w-48 max-w-full" />
							<Skeleton className="my-1 h-3 w-3/4" />
						</div>
					</div>
				))}
			</CardContent>
		</Card>
	);
}
