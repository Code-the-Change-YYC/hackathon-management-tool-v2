import PageHeader from "@/app/components/PageHeader";
import { JudgeRubricSkeleton } from "./JudgeRubric";

export function RubricSkeleton() {
	return (
		<section
			aria-busy="true"
			aria-label="Loading rubric"
			className="flex flex-col gap-6"
		>
			<PageHeader
				description="Guidelines and criteria for assessing projects."
				title="Judging Rubric"
			/>
			<JudgeRubricSkeleton />
		</section>
	);
}
