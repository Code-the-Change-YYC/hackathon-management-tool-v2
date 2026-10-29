import PageHeader from "@/app/components/PageHeader";
import { RubricCardSkeleton } from "@/app/components/rubric/RubricCard";

export function RubricSkeleton() {
	return (
		<section
			aria-busy="true"
			aria-label="Loading rubric"
			className="flex flex-col gap-6"
		>
			<PageHeader
				description="Review the criteria and score ranges used for all rounds."
				title="Judging Rubric"
			/>
			<RubricCardSkeleton />
		</section>
	);
}
