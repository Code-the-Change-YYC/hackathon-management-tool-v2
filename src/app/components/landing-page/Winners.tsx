import { getWinners } from "@/app/actions";
import { SectionTitle, SectionWrapper } from "./InfoSection";
import WinnersCarousel from "./WinnersCarousel";

export default async function Winners() {
	const winners = await getWinners();

	return (
		<SectionWrapper bgColor="bg-pinky-peach">
			<div className="flex w-full flex-col gap-10 md:gap-12">
				<SectionTitle
					title="Last Year's"
					titleColor="text-awesomer-purple"
					titleHighlight="Winners"
					titlePrefixColor="text-dark-grey"
				/>
				{winners.length ? (
					<WinnersCarousel winners={winners} />
				) : (
					<p className="text-dark-grey">
						Winner information is currently unavailable. Please check back soon.
					</p>
				)}
			</div>
		</SectionWrapper>
	);
}
