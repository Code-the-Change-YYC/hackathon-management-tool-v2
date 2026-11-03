import Banner from "@/app/components/Banner";
import {
	describeJudgingSchedule,
	presentationsEnd,
	type TeamJudgingRound
} from "@/lib/participant-judging";
import CurrentEventImages from "../CurrentEventImages";

export function TeamJudgingBanner({ judging }: { judging: TeamJudgingRound }) {
	const { round, assignments } = judging;
	const first = assignments[0];
	const end = presentationsEnd(judging);
	if (!first || !end) return null;
	const isFinal = round.kind === "final";

	return (
		<Banner
			buttonText=""
			colour="red"
			description={describeJudgingSchedule(judging)}
			endTime={end}
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
