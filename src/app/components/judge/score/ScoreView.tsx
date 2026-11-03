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
	children
}: {
	title: string;
	children: ReactNode;
}) {
	return (
		<Empty className="mx-auto max-w-xl py-16">
			<EmptyHeader>
				<EmptyTitle>
					<h1 className="m-0 font-semibold text-xl">{title}</h1>
				</EmptyTitle>
				<EmptyDescription>{children}</EmptyDescription>
			</EmptyHeader>
			<Link className={buttonVariants({ variant: "outline" })} href="/judge">
				Back to dashboard
			</Link>
		</Empty>
	);
}

function JudgeScorecard({
	assignment,
	criteria,
	userId
}: {
	assignment: JudgeAssignment;
	criteria: Criterion[];
	userId: string;
}) {
	const currentTime = useCurrentTime();
	const card = useJudgeScorecard(assignment, criteria, userId);

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
	criteria,
	scoresReleased,
	userId
}: {
	assignment: JudgeAssignment | null;
	criteria: Criterion[];
	scoresReleased: boolean;
	userId: string;
}) {
	if (!assignment)
		return (
			<ScoreMessage title="Assignment unavailable">
				This team is not assigned to your judging account.
			</ScoreMessage>
		);
	if (assignment.table.round.kind === "final")
		return (
			<ScoreMessage title="Finalists are ranked, not scored">
				Rank your top finalists from your dashboard.
			</ScoreMessage>
		);
	if (scoresReleased)
		return (
			<ScoreMessage title="Scoring is closed">
				Scores were released when the winners were announced, so they can’t be
				changed.
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
			criteria={roundCriteria.sort(sortCriteria)}
			key={`${userId}:${assignment.id}`}
			userId={userId}
		/>
	);
}
