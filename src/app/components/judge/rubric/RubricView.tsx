import PageHeader from "@/app/components/PageHeader";
import { RubricCard } from "@/app/components/rubric/RubricCard";
import type { Criterion } from "../judgePortal";

export function RubricView({ criteria }: { criteria: Criterion[] }) {
	return (
		<div className="flex flex-col gap-6">
			<PageHeader
				description="Review the criteria and score ranges used for all rounds."
				title="Judging Rubric"
			/>
			<RubricCard criteria={criteria} />
		</div>
	);
}
