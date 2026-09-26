"use client";

import { useEffect, useState } from "react";
import { buttonVariants } from "@/app/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle
} from "@/app/components/ui/card";
import type { RouterOutputs } from "@/trpc/react";

type Assignment = NonNullable<
	RouterOutputs["judgingAssignments"]["getMineForActiveRound"]
>;

function getMeetingUrl(value: string | null) {
	if (!value) return null;
	try {
		const url = new URL(value);
		return url.protocol === "https:" || url.protocol === "http:"
			? url.href
			: null;
	} catch {
		return null;
	}
}

export function JudgingAssignmentCard({
	assignment
}: {
	assignment: Assignment;
}) {
	const [timeZone, setTimeZone] = useState("UTC");
	useEffect(
		() => setTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone),
		[]
	);
	const meetingUrl = getMeetingUrl(assignment.room.roomLink);
	const timeSlot = assignment.timeSlot;
	const timeLabel = timeSlot
		? new Intl.DateTimeFormat("en-US", {
				weekday: "long",
				month: "long",
				day: "numeric",
				hour: "numeric",
				minute: "2-digit",
				timeZoneName: "short",
				timeZone
			}).format(timeSlot)
		: null;

	return (
		<Card>
			<CardHeader>
				<CardTitle>
					<h2>Your judging assignment</h2>
				</CardTitle>
				<CardDescription>{assignment.team.name}</CardDescription>
			</CardHeader>
			<CardContent>
				<dl className="grid gap-5 sm:grid-cols-2">
					<div>
						<dt className="text-muted-foreground">Round</dt>
						<dd>{assignment.room.round.name}</dd>
					</div>
					<div>
						<dt className="text-muted-foreground">Room</dt>
						<dd>{assignment.room.name || "Room to be announced"}</dd>
					</div>
					<div className="sm:col-span-2">
						<dt className="text-muted-foreground">Judging time</dt>
						<dd>
							{timeSlot ? (
								<time dateTime={timeSlot.toISOString()}>{timeLabel}</time>
							) : (
								"Time to be announced"
							)}
						</dd>
					</div>
				</dl>
			</CardContent>
			<CardFooter>
				{meetingUrl ? (
					<a
						className={buttonVariants()}
						href={meetingUrl}
						rel="noopener noreferrer"
						target="_blank"
					>
						Join judging meeting
						<span className="sr-only"> (opens in a new tab)</span>
					</a>
				) : (
					<p className="text-muted-foreground">
						Your meeting link is not available yet.
					</p>
				)}
			</CardFooter>
		</Card>
	);
}
