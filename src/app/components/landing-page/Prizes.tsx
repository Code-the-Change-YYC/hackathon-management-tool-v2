import { GiftLine, TrophyLine } from "@mingcute/react";
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

// Listed in podium order (2nd, 1st, 3rd). On phones the cards stack with
// 1st place on top instead.
const PRIZES: Prize[] = [
	{
		place: "2nd place",
		amount: "$3,000",
		icon: GiftLine,
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
		icon: GiftLine,
		cardStyles:
			"order-3 border-medium-green shadow-[8px_8px_0_0_var(--color-dark-green)]",
		badgeStyles: "bg-mint-green text-medium-green"
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
				<div className="flex flex-col gap-4">
					<SectionTitle
						accentPosition="after"
						accentSrc="accent_green"
						titleColor="text-medium-green"
						titleHighlight="Prizes"
					/>
					<p className="font-medium text-dark-grey text-lg md:text-xl">
						$10,000 in prizes for the top three teams.
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
			</div>
		</SectionWrapper>
	);
}
