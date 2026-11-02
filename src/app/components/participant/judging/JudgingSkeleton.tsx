import PageHeader from "@/app/components/PageHeader";
import { RubricCardSkeleton } from "@/app/components/rubric/RubricCard";
import { JudgingTimelineSkeleton } from "./JudgingTimeline";
import { TeamJudgingCardSkeleton } from "./TeamJudgingCard";

export function JudgingSkeleton() {
	return (
		<section
			aria-busy="true"
			aria-label="Loading judging information"
			className="flex flex-col gap-6"
		>
			<PageHeader
				description="Understand the scoring so you know where to focus."
				title="Judging"
			/>
			<div className="flex flex-col gap-6">
				<TeamJudgingCardSkeleton />
				<JudgingTimelineSkeleton />
				<RubricCardSkeleton title="Judging Rubric" />
			</div>
		</section>
	);
}
