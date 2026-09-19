import { ArrowRightLine } from "@mingcute/react";
import Link from "next/link";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle
} from "@/app/components/ui/card";
import { cn } from "@/lib/utils";
import {
	type Criterion,
	formatTime,
	getAssignmentRoomName,
	getAssignmentTotal,
	getCriteriaScore,
	getScoreTextColor,
	getTeamCode,
	isAssignmentScored,
	type JudgeAssignment
} from "./judgePortal";

export function JudgeTeamCard({
	assignment,
	criteria,
	currentTime
}: {
	assignment: JudgeAssignment;
	criteria: Criterion[];
	currentTime: Date;
}) {
	const scored = isAssignmentScored(assignment, criteria);
	const canScore = !assignment.timeSlot || assignment.timeSlot <= currentTime;
	const scoreHref = `/judge/score/${assignment.id}`;
	const total = getAssignmentTotal(assignment, criteria);

	return (
		<Card className="min-h-44 min-w-0">
			<CardHeader>
				<div className="flex items-start justify-between gap-2">
					<CardTitle className="min-w-0">
						<h3 className="m-0 break-words">{assignment.team.name}</h3>
					</CardTitle>
					{scored && (
						<Badge
							render={
								<Link
									aria-label={`Edit score for ${assignment.team.name}`}
									href={scoreHref}
								/>
							}
							variant="accent"
						>
							Scored
						</Badge>
					)}
				</div>
				<CardDescription>
					<div className="flex flex-wrap justify-between gap-x-4 gap-y-1">
						<span>Team ID: {getTeamCode(assignment)}</span>
						<span>
							{formatTime(assignment.timeSlot)} · {assignment.room.round.name}
						</span>
					</div>
					<span>{getAssignmentRoomName(assignment)}</span>
				</CardDescription>
			</CardHeader>
			<CardContent className="flex flex-1 flex-col gap-4">
				{scored ? (
					<>
						<div className="flex flex-wrap gap-2">
							{criteria
								.filter((criterion) => criterion.isSidepot)
								.map((criterion) => {
									const value = getCriteriaScore(assignment, criterion.id);
									return value === undefined ? null : (
										<Badge
											className="h-auto max-w-full whitespace-normal"
											key={criterion.id}
											variant="outline"
										>
											{criterion.name} {value}/{criterion.maxScore}
										</Badge>
									);
								})}
						</div>
						<dl className="grid grid-cols-[repeat(auto-fit,minmax(3.5rem,1fr))] gap-2 text-center">
							{criteria
								.filter((criterion) => !criterion.isSidepot)
								.map((criterion) => {
									const value = getCriteriaScore(assignment, criterion.id) ?? 0;
									return (
										<div
											className="flex min-w-0 flex-col-reverse gap-1"
											key={criterion.id}
										>
											<dt className="break-words text-xs uppercase">
												{criterion.name}
											</dt>
											<dd
												className={cn(
													"m-0 tabular-nums",
													getScoreTextColor(value, criterion.maxScore)
												)}
											>
												{value}
											</dd>
										</div>
									);
								})}
							<div className="flex flex-col-reverse gap-1 border-border border-l">
								<dt className="text-xs uppercase">Total</dt>
								<dd className="m-0 tabular-nums">
									<strong>{total.total}</strong>
									{total.max > 0 && (
										<span className="text-muted-foreground">/{total.max}</span>
									)}
								</dd>
							</div>
						</dl>
					</>
				) : (
					<div className="mt-auto flex justify-end">
						{canScore ? (
							<Button
								aria-label={`Score ${assignment.team.name}`}
								render={<Link href={scoreHref} />}
							>
								Score team <ArrowRightLine data-icon="inline-end" />
							</Button>
						) : (
							<Button
								aria-label={`Score ${assignment.team.name}`}
								disabled
								variant="secondary"
							>
								Score team <ArrowRightLine data-icon="inline-end" />
							</Button>
						)}
					</div>
				)}
			</CardContent>
		</Card>
	);
}
