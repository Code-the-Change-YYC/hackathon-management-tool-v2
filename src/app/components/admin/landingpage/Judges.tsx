import { judges } from "./data/judges";
import JudgeCard from "./ui/JudgeItem";

export default function Judges() {
	return (
		<section className="w-full bg-white px-6 py-10 sm:px-12">
			<div className="mb-6">
				<h2 className="font-bold text-2xl text-dark-grey">Judges</h2>
				<div className="mt-1 h-1 w-12 rounded-full bg-dark-green" />
			</div>

			<div className="grid grid-cols-2 gap-x-8 gap-y-6 md:grid-cols-3">
				{judges.map((judge) => (
					<JudgeCard
						company={judge.company}
						image={judge.image}
						key={judge.id}
						name={judge.name}
					/>
				))}
			</div>
		</section>
	);
}
