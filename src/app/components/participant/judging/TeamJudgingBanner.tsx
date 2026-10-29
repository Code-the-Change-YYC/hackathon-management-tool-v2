import { addMinutes } from "date-fns";
import Banner from "@/app/components/Banner";
import { formatTime } from "@/lib/datetime";
import { ARRIVAL_BUFFER_MINUTES } from "@/lib/judging";
import type { TeamJudging } from "@/lib/participant-judging";
import CurrentEventImages from "../CurrentEventImages";

function formatMinutes(minutes: number) {
	return `${minutes} minute${minutes === 1 ? "" : "s"}`;
}

export function TeamJudgingBanner({
	judging
}: {
	judging: TeamJudging[number];
}) {
	const { round, assignments } = judging;
	const first = assignments[0];
	const last = assignments.at(-1);
	if (!first || !last) return null;

	const presentationMinutes = round.presentationMinutes ?? 0;
	const arriveBy = `Arrive by ${formatTime(addMinutes(first.startsAt, -ARRIVAL_BUFFER_MINUTES))}.`;
	const length = `${formatMinutes(presentationMinutes)}, including Q&A.`;
	const isFinal = round.kind === "final";
	const description = isFinal
		? `${arriveBy} Present to every judge at ${formatTime(first.startsAt)}. You have ${length}`
		: `${arriveBy} Present at ${assignments
				.map(
					(assignment) =>
						`Table ${assignment.tableNumber} at ${formatTime(assignment.startsAt)}`
				)
				.join(
					", then "
				)}. You have ${formatMinutes(presentationMinutes)} per presentation, including Q&A.`;

	return (
		<Banner
			buttonText=""
			colour="red"
			description={description}
			endTime={addMinutes(last.startsAt, presentationMinutes)}
			image={<CurrentEventImages />}
			location={
				isFinal
					? "Final round · all judges"
					: assignments
							.map((assignment) => `Table ${assignment.tableNumber}`)
							.join(" → ")
			}
			startTime={first.startsAt}
			title={
				isFinal ? "You’re a finalist!" : `${round.name}: your team’s judging`
			}
		/>
	);
}
