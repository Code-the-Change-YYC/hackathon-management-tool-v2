import {
	FlashLine,
	GiftLine,
	HandHeartLine,
	MedalLine,
	ShieldLine,
	TrophyLine
} from "@mingcute/react";
import { cn } from "@/lib/utils";
import type { MingCuteIcon } from "@/types/landingPage";
import { SectionTitle, SectionWrapper, Squiggle } from "./InfoSection";

type Prize = {
	place: string;
	amount: string;
	icon: MingCuteIcon;
	cardStyles: string;
	badgeStyles: string;
};

type SidePot = {
	name: string;
	amount: string;
	donation?: string;
	sponsor: string;
	icon: MingCuteIcon;
	cardStyles: string;
	badgeStyles: string;
};

type MLHPrize = {
	sponsor: string;
	reward: string;
};

// Listed in podium order (2nd, 1st, 3rd). On phones the cards stack with
// 1st place on top instead.
const PRIZES: Prize[] = [
	{
		place: "2nd place",
		amount: "$3,000",
		icon: MedalLine,
		cardStyles:
			"order-2 border-dark-pink shadow-[8px_8px_0_0_var(--color-medium-pink)] sm:order-1",
		badgeStyles: "bg-pastel-pink text-dark-pink"
	},
	{
		place: "1st place",
		amount: "$5,000",
		icon: TrophyLine,
		cardStyles:
			"order-1 border-awesomer-purple bg-awesomer-purple text-white shadow-[8px_8px_0_0_var(--color-awesome-purple)] sm:order-2 sm:py-12 md:py-16",
		badgeStyles: "bg-white text-awesomer-purple"
	},
	{
		place: "3rd place",
		amount: "$2,000",
		icon: MedalLine,
		cardStyles:
			"order-3 border-medium-green shadow-[8px_8px_0_0_var(--color-dark-green)]",
		badgeStyles: "bg-mint-green text-medium-green"
	}
];

const SIDE_POTS: SidePot[] = [
	{
		name: "Best Local Impact",
		amount: "$150",
		donation: "$150 donated to charity",
		sponsor: "Benevity",
		icon: HandHeartLine,
		cardStyles:
			"border-medium-green shadow-[6px_6px_0_0_var(--color-dark-green)]",
		badgeStyles: "bg-mint-green text-medium-green"
	},
	{
		name: "Best in Trust and Transparency",
		amount: "$150",
		sponsor: "Clio",
		icon: ShieldLine,
		cardStyles:
			"border-dark-pink shadow-[6px_6px_0_0_var(--color-medium-pink)]",
		badgeStyles: "bg-pastel-pink text-dark-pink"
	},
	{
		name: "Best Use of Real-World Energy Data",
		amount: "$500",
		sponsor: "Voltex Solutions",
		icon: FlashLine,
		cardStyles:
			"border-awesomer-purple shadow-[6px_6px_0_0_var(--color-awesome-purple)]",
		badgeStyles: "bg-accent text-awesomer-purple"
	}
];

const MLH_PRIZES: MLHPrize[] = [
	{
		sponsor: "GoDaddy Registry",
		reward: "Digital Gift Card"
	},
	{
		sponsor: "Gemini API",
		reward: "MLH Swag Kits"
	},
	{
		sponsor: "Vultr",
		reward: "Assorted Prizes"
	},
	{
		sponsor: "Solana",
		reward: "Unruggable Hardware Wallets"
	},
	{
		sponsor: "Auth0",
		reward: "Wireless Headphones"
	},
	{
		sponsor: "Tiger Data",
		reward: "Stream Deck Mini"
	},
	{
		sponsor: "Entire",
		reward: "Mini Portable Projector"
	}
];

export default function Prizes() {
	return (
		<SectionWrapper
			bgColor="bg-fuzzy-peach"
			decoration={
				<Squiggle
					className="-right-20 top-[calc(100%+4rem)] w-72"
					src="green_squiggle3"
				/>
			}
		>
			<div className="flex w-full flex-col gap-10 md:gap-14">
				{/* Main prizes */}
				<div className="flex flex-col gap-4">
					<SectionTitle
						accentPosition="after"
						accentSrc="accent_green"
						titleColor="text-medium-green"
						titleHighlight="Prizes"
					/>
					<p className="font-medium text-dark-grey text-lg md:text-xl">
						$10,000 in prizes for the top three teams. Half of each prize is
						donated to charity.
					</p>
				</div>

				<ul className="grid grid-cols-1 gap-6 sm:grid-cols-3 sm:items-end lg:gap-10">
					{PRIZES.map(
						({ place, amount, icon: Icon, cardStyles, badgeStyles }) => (
							<li
								className={cn(
									"flex items-center gap-5 rounded-[30px] border-4 bg-white p-5 text-dark-grey sm:flex-col sm:gap-4 sm:px-4 sm:py-8 sm:text-center md:p-8",
									cardStyles
								)}
								key={place}
							>
								<div
									className={cn(
										"flex size-14 shrink-0 items-center justify-center rounded-full md:size-20",
										badgeStyles
									)}
								>
									<Icon aria-hidden="true" className="size-7 md:size-10" />
								</div>
								<div className="flex flex-col gap-1">
									<p className="font-semibold text-sm uppercase tracking-widest opacity-80">
										{place}
									</p>
									<p className="font-bold text-3xl md:text-4xl lg:text-5xl">
										{amount}
									</p>
								</div>
							</li>
						)
					)}
				</ul>

				{/* Side pot prizes */}
				<div className="flex flex-col gap-8">
					<div className="flex flex-col gap-2">
						<h3 className="font-bold text-2xl text-awesomer-purple md:text-3xl">
							Side Pot Prizes
						</h3>
						<p className="text-base text-dark-grey md:text-lg">
							Additional prizes for projects that stand out in special
							categories.
						</p>
					</div>

					<ul className="grid grid-cols-1 gap-6 sm:grid-cols-3 sm:items-stretch lg:gap-10">
						{SIDE_POTS.map(
							({
								name,
								amount,
								donation,
								sponsor,
								icon: Icon,
								cardStyles,
								badgeStyles
							}) => (
								<li
									className={cn(
										"flex h-full flex-col items-center justify-center gap-4 rounded-[30px] border-4 bg-white p-6 text-center text-dark-grey md:p-8",
										cardStyles
									)}
									key={name}
								>
									<div
										className={cn(
											"flex size-14 shrink-0 items-center justify-center rounded-full md:size-16",
											badgeStyles
										)}
									>
										<Icon aria-hidden="true" className="size-7 md:size-8" />
									</div>

									<div className="flex flex-col items-center gap-2">
										<p className="font-semibold text-sm uppercase tracking-wide">
											{name}
										</p>
										<p className="font-bold text-3xl md:text-4xl">
											{amount} Cash
										</p>

										{donation && (
											<p className="font-medium text-dark-grey text-sm md:text-base">
												+ {donation}
											</p>
										)}
									</div>
									<p className="mt-auto w-full border-dark-grey/15 border-t pt-3 text-dark-grey text-sm">
										Sponsored by{" "}
										<span className="font-semibold">{sponsor}</span>
									</p>
								</li>
							)
						)}
					</ul>

					{/* MLH Prizes */}
					<div className="flex flex-col gap-8">
						<div className="flex flex-col gap-2">
							<h3 className="font-bold text-2xl text-dark-pink md:text-3xl">
								MLH Prizes
							</h3>
							<p className="text-base text-dark-grey md:text-lg">
								Additional prizes and challenges brought to you by Major League
								Hacking and its partners.
							</p>
						</div>

						<ul className="flex flex-wrap justify-center gap-4 md:gap-5">
							{MLH_PRIZES.map(({ sponsor, reward }) => (
								<li
									className={cn(
										"flex w-[calc((100%-1rem)/2)] flex-col items-center justify-center",
										"gap-3 rounded-2xl border-2 border-dark-pink bg-white",
										"p-4 text-center text-dark-grey",
										"shadow-[4px_4px_0_0_var(--color-medium-pink)]",
										"sm:w-[calc((100%-2rem)/3)]",
										"lg:w-[calc((100%-3.75rem)/4)]",
										"hover:-translate-y-1 transition-transform duration-300"
									)}
									key={sponsor}
								>
									<div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-fuzzy-peach/60 text-pinky-peach">
										<GiftLine aria-hidden="true" className="size-5" />
									</div>

									<div className="flex flex-col items-center gap-1">
										<p className="font-bold text-sm md:text-base">{sponsor}</p>

										<p className="text-dark-grey text-xs md:text-sm">
											{reward}
										</p>
									</div>
								</li>
							))}
						</ul>
					</div>
				</div>
			</div>
		</SectionWrapper>
	);
}
