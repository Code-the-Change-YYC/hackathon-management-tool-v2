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
	formatTime,
	getRankingState,
	type JudgeAssignment,
	sortAssignments
} from "../judgePortal";
import { RankFlow } from "./RankFlow";

function RankMessage({
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

export function RankView({
	finalists,
	scoresReleased
}: {
	finalists: JudgeAssignment[];
	scoresReleased: boolean;
}) {
	const currentTime = useCurrentTime();
	const round = finalists[0]?.table.round;
	if (!round)
		return (
			<RankMessage title="No finalists to rank">
				You can rank the finalists once the final round is published.
			</RankMessage>
		);

	switch (getRankingState(round, currentTime, scoresReleased)) {
		case "upcoming":
			return (
				<RankMessage title="Ranking has not opened yet">
					You can rank the finalists from {formatTime(round.startTime)}.
				</RankMessage>
			);
		case "closed":
			return (
				<RankMessage title="Ranking is closed">
					Rankings closed when the winners were announced.
				</RankMessage>
			);
		case "open":
			return (
				<RankFlow
					finalists={finalists.slice().sort(sortAssignments)}
					roundName={round.name}
				/>
			);
	}
}
