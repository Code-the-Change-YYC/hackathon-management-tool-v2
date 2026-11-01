"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { buttonVariants } from "@/app/components/ui/button";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyTitle
} from "@/app/components/ui/empty";
import { useCurrentTime } from "@/hooks/use-current-time";
import {
	type Criterion,
	formatTime,
	getAssignmentCriteria,
	isAssignmentScored,
	isScoringOpen,
	type JudgeAssignment,
	sortCriteria
} from "../judgePortal";
import { ScoreFlow } from "./ScoreFlow";
import { ScoreSkeleton } from "./ScoreSkeleton";
import { useJudgeScorecard } from "./useJudgeScorecard";

function canScoreAssignment(assignment: JudgeAssignment, currentTime: Date) {
	return assignment.scores.length > 0 || isScoringOpen(assignment, currentTime);
}

function ScoreMessage({
	title,
	children,
	action
}: {
	title: string;
	children: ReactNode;
	action?: ReactNode;
}) {
	return (
		<Empty className="mx-auto max-w-xl py-16">
			<EmptyHeader>
				<EmptyTitle>
					<h1 className="m-0 font-semibold text-xl">{title}</h1>
				</EmptyTitle>
				<EmptyDescription>{children}</EmptyDescription>
			</EmptyHeader>
			<div className="flex flex-wrap justify-center gap-3">
				{action}
				<Link className={buttonVariants({ variant: "outline" })} href="/judge">
					Back to dashboard
				</Link>
			</div>
		</Empty>
	);
}

function JudgeScorecard({
	assignment,
	assignments,
	criteria,
	userId
}: {
	assignment: JudgeAssignment;
	assignments: JudgeAssignment[];
	criteria: Criterion[];
	userId: string;
}) {
	const currentTime = useCurrentTime();
	const card = useJudgeScorecard(assignment, criteria, userId);

	if (card.status === "saved") {
		const next = assignments.find(
			(item) =>
				item.id !== assignment.id &&
				item.table.roundId === assignment.table.roundId &&
				!isAssignmentScored(item, criteria) &&
				canScoreAssignment(item, currentTime)
		);
		return (
			<ScoreMessage
				action={
					next && (
						<Link className={buttonVariants()} href={`/judge/score/${next.id}`}>
							Score {next.team.name}
						</Link>
					)
				}
				title="Scores submitted"
			>
				Your scores for {assignment.team.name} have been saved.
			</ScoreMessage>
		);
	}
	if (!card.initialized) return <ScoreSkeleton />;
	if (!canScoreAssignment(assignment, currentTime))
		return (
			<ScoreMessage title="Scoring has not opened yet">
				You can score this team from {formatTime(assignment.startsAt)}.
			</ScoreMessage>
		);

	return <ScoreFlow assignment={assignment} card={card} criteria={criteria} />;
}

export function ScoreView({
	assignment,
	assignments,
	criteria,
	userId
}: {
	assignment: JudgeAssignment | null;
	assignments: JudgeAssignment[];
	criteria: Criterion[];
	userId: string;
}) {
	if (!assignment)
		return (
			<ScoreMessage title="Assignment unavailable">
				This team is not assigned to your judging account.
			</ScoreMessage>
		);
	const roundCriteria = getAssignmentCriteria(assignment, criteria);
	if (!roundCriteria.length)
		return (
			<ScoreMessage title="No criteria available">
				Organizers need to publish the judging criteria before you can score
				this team.
			</ScoreMessage>
		);
	return (
		<JudgeScorecard
			assignment={assignment}
			assignments={assignments}
			criteria={roundCriteria.sort(sortCriteria)}
			key={`${userId}:${assignment.id}`}
			userId={userId}
		/>
	);
}
