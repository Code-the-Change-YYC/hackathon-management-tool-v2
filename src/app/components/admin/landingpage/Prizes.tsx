import InfoSection from "./ui/InfoSection";

const PODIUM_DATA = [
	{
		place: "2nd",
		amount: "$3,000",
		color: "bg-awesome-purple",
		height: "h-36 md:h-48",
		order: "order-1"
	},
	{
		place: "1st",
		amount: "$5,000",
		color: "bg-awesomer-purple",
		height: "h-52 md:h-64",
		order: "order-2"
	},
	{
		place: "3rd",
		amount: "$2,000",
		color: "bg-lilac-purple",
		height: "h-28 md:h-36",
		order: "order-3"
	}
];

function Podium() {
	return (
		<div className="mx-8 flex w-[calc(100%+4rem)] items-end justify-center gap-6 md:gap-10">
			{PODIUM_DATA.map((prize) => (
				<div
					className={`flex w-24 flex-col items-center md:w-40 ${prize.order}`}
					key={prize.place}
				>
					<p className="mb-2 font-bold text-dark-grey text-lg md:text-xl">
						{prize.amount}
					</p>
					<div
						className={`flex w-full flex-col items-center justify-center rounded-t-xl ${prize.color} ${prize.height} shadow-lg transition-all duration-200 hover:scale-105`}
					>
						<span className="font-black text-2xl text-white md:text-3xl">
							{prize.place}
						</span>
					</div>
				</div>
			))}
		</div>
	);
}

export default function Prizes() {
	return (
		<InfoSection
			accentPosition="after"
			accentSrc="/svgs/landingPage/accent_green.svg"
			bgColor="bg-fuzzy-peach"
			bodyContent={<Podium />}
			bodyTextColor="text-dark-grey"
			imageAlt="Prizes"
			imageSrc="/svgs/landingPage/prizes_illustration.svg"
			reverse
			titleColor="text-medium-green"
			titleHighlight="Prizes"
		/>
	);
}
