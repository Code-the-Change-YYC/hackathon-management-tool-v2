import Image from "next/image";
import { judges } from "./data/judges";
import JudgeItem from "./ui/JudgeItem";

export default function Judges() {
	return (
		<section className="w-full bg-white px-[84px] py-[81px]">
			<div className="mb-[40px]">
				<h2 className="font-bold text-2xl text-dark-grey">Judges</h2>
				<Image
					alt=""
					height={15}
					src="/svgs/landingPage/green_underline.svg"
					width={100}
				/>
			</div>

			<div className="grid grid-cols-2 gap-[40px] md:grid-cols-3">
				{judges.map((judge) => (
					<JudgeItem
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
