import { criteria } from "./data/criteria";
import CriteriaItem from "./ui/CriteriaItem";

export default function JudgingCriteria() {
	return (
		<section className="w-full bg-pastel-green p-[40px]">
			<h2 className="mb-[40px] font-bold text-2xl text-dark-grey">
				Judging{" "}
				<span className="font-bold text-awesomer-purple italic">Criteria</span>
			</h2>

			<div className="flex flex-col gap-[40px]">
				{criteria.map((criterion) => (
					<CriteriaItem key={criterion.id} text={criterion.text} />
				))}
			</div>
		</section>
	);
}
