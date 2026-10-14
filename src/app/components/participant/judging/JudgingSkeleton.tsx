import { BannerSkeleton } from "@/app/components/Banner";
import PageHeader from "@/app/components/PageHeader";
import { ParticipantRubricSkeleton } from "../ParticipantRubric";
import { JudgingStatusSkeleton } from "../ParticipantStatus";

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
			<div className="flex flex-col gap-12">
				<BannerSkeleton />
				<JudgingStatusSkeleton variant="detailed" />
				<div className="flex min-w-0 flex-col gap-6">
					<h2 className="font-medium text-xl">Judging Rubric</h2>
					<ParticipantRubricSkeleton />
				</div>
			</div>
		</section>
	);
}
