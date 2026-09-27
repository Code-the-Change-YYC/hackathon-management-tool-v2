import InfoSection, { Squiggle } from "./InfoSection";

// Listed in podium order: 2nd on the left, 1st in the middle, 3rd on the right
const PODIUM_DATA = [
	{
		place: "2nd",
		amount: "$3,000",
		color: "bg-awesome-purple",
		height: "h-32 sm:h-40 md:h-48"
	},
	{
		place: "1st",
		amount: "$5,000",
		color: "bg-awesomer-purple",
		height: "h-44 sm:h-52 md:h-64"
	},
	{
		place: "3rd",
		amount: "$2,000",
		color: "bg-lilac-purple",
		height: "h-24 sm:h-32 md:h-36"
	}
];

function Podium() {
	return (
		<div className="mx-auto flex w-full max-w-lg items-end justify-center gap-3 sm:gap-6 lg:gap-8">
			{PODIUM_DATA.map((prize) => (
				<div
					className="flex max-w-40 flex-1 flex-col items-center"
					key={prize.place}
				>
					<p className="mb-2 font-bold text-dark-grey text-lg md:text-xl">
						{prize.amount}
					</p>
					<div
						className={`flex w-full flex-col items-center justify-center rounded-t-xl rounded-b-md ${prize.color} ${prize.height} transition-transform duration-200 hover:scale-105`}
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
			accentSrc="accent_green"
			bgColor="bg-fuzzy-peach"
			bodyContent={<Podium />}
			bodyTextColor="text-dark-grey"
			decoration={
				<Squiggle
					className="-right-20 top-[calc(100%+4rem)] w-72"
					src="green_squiggle3"
				/>
			}
			imageAlt="Prizes"
			imageSrc="/svgs/landingPage/prizes_illustration.svg"
			reverse
			titleColor="text-medium-green"
			titleHighlight="Prizes"
		/>
	);
}
