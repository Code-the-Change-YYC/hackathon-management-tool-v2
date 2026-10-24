import PageHeader from "@/app/components/PageHeader";
import type { Criterion } from "../judgePortal";
import { JudgeRubric } from "./JudgeRubric";

export function RubricView({ criteria }: { criteria: Criterion[] }) {
	return (
		<div className="flex flex-col gap-6">
			<PageHeader
				description="Guidelines and criteria for assessing projects."
				title="Judging Rubric"
			/>
			<JudgeRubric criteria={criteria} />
		</div>
	);
}
