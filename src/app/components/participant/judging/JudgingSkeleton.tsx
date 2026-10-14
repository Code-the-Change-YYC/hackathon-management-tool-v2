import { BannerSkeleton } from "@/app/components/Banner";
import PageHeader from "@/app/components/PageHeader";
import { Card, CardContent, CardHeader } from "@/app/components/ui/card";
import { JudgingStatusSkeleton } from "../dashboard/JudgingStatus";
import { ParticipantRubricSkeleton } from "../ParticipantRubric";

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
				<Card className="min-w-0">
					<CardHeader>
						<h2 className="font-medium text-xl">Judging Rubric</h2>
					</CardHeader>
					<CardContent>
						<ParticipantRubricSkeleton />
					</CardContent>
				</Card>
			</div>
		</section>
	);
}
