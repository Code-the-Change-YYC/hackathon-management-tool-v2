import { criteria } from "./data/criteria";
import CriteriaItem from "./ui/CriteriaItem";

export default function JudgingCriteria() {
	return (
		<section className="w-full bg-pastel-green px-21 py-20.25">
			<h2 className="mb-10 font-bold text-2xl text-dark-grey">
				Judging{" "}
				<span className="font-bold text-awesomer-purple italic">Criteria</span>
			</h2>

			<div className="grid w-full max-w-7xl gap-6 md:grid-cols-2 lg:grid-cols-3 lg:gap-8">
				{criteria.map((criterion) => (
					<CriteriaItem
						category={criterion.category}
						key={criterion.category}
						text={criterion.description}
					/>
				))}
			</div>
		</section>
	);
}
