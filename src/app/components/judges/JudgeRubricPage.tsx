import PageHeader from "@/app/components/PageHeader";
import { tryCatch } from "@/lib/utils";
import { api } from "@/trpc/server";
import { ErrorCard } from "./ErrorCard";
import { JudgeRubric } from "./JudgeRubric";

export async function JudgeRubricPage() {
	const { data, error } = await tryCatch(api.criteria.getAll());
	if (error)
		return (
			<ErrorCard message={`Rubric could not be loaded: ${error.message}`} />
		);

	return (
		<div className="flex flex-col gap-6">
			<PageHeader
				description="Guidelines and criteria for assessing projects."
				title="Judging Rubric"
			/>

			<JudgeRubric criteria={data} />
		</div>
	);
}
