import RubricTable from "../../components/judges/RubricTable";

export default function JudgeRubricPage() {
	return (
		<div>
			<p className="mb-2 font-medium text-dashboard-grey text-xs uppercase tracking-wide">
				Judging - Rubric
			</p>
			<h1 className="mb-6 text-center font-bold text-3xl text-emerald-green sm:text-4xl">
				Judging Rubric
			</h1>
			<RubricTable />
		</div>
	);
}
