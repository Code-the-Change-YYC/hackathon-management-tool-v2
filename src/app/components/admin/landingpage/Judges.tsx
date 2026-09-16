import Image from "next/image";
import { getJudges } from "@/app/actions";
import JudgeItem from "./ui/JudgeItem";

export default async function Judges() {
	const judges = await getJudges();

	const JudgesList = () => (
		<div className="mx-auto grid max-w-7xl grid-cols-1 gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 lg:gap-x-12.5 lg:gap-y-11.75">
			{judges.map((judge) => (
				<JudgeItem judge={judge} key={judge.sys.id} />
			))}
		</div>
	);
	return (
		<section
			aria-labelledby="judges-heading"
			className="w-full bg-white px-6 py-12 sm:px-12 md:px-20 lg:px-21 lg:py-20.25"
		>
			<div className="mx-auto mb-10 max-w-7xl">
				<h2
					className="font-semibold text-2xl text-dark-grey sm:text-3xl md:text-5xl"
					id="judges-heading"
				>
					Judges
				</h2>
				<Image
					alt=""
					aria-hidden="true"
					height={17}
					src="/svgs/landingPage/green_underline.svg"
					width={130}
				/>
			</div>

			{judges.length ? <JudgesList /> : <JudgesUnavailable />}
		</section>
	);
}

const JudgesUnavailable = () => (
	<p className="mx-auto max-w-7xl text-dark-grey">
		Judge information will be announced soon.
	</p>
);
