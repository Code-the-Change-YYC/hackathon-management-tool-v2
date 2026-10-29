import { BannerSkeleton } from "@/app/components/Banner";
import PageHeader from "@/app/components/PageHeader";
import { RubricCardSkeleton } from "@/app/components/rubric/RubricCard";
import { JudgingStatusSkeleton } from "../dashboard/JudgingStatus";

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
				<BannerSkeleton />
				<JudgingStatusSkeleton variant="detailed" />
				<RubricCardSkeleton title="Judging Rubric" />
			</div>
		</section>
	);
}
