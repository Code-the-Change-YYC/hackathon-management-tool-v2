import type { PastHackathonWinner } from "@/types/contentfulTypes";
import { SectionWrapper } from "./ui/InfoSection";
import WinnersCarousel from "./WinnersCarousel";

type WinnersProps = {
	winners: PastHackathonWinner[];
};

export default function Winners({ winners }: WinnersProps) {
	return (
		<Header>
			{winners.length ? (
				<WinnersCarousel winners={winners} />
			) : (
				<NotAvailable />
			)}
		</Header>
	);
}
const NotAvailable = () => {
	return (
		<p className="text-dark-grey">
			Winner information is currently unavailable. Please check back soon.
		</p>
	);
};
const Header = ({ children }: { children: React.ReactNode }) => {
	return (
		<SectionWrapper bgColor="bg-pinky-peach">
			<div className="w-full max-w-7xl">
				<div className="relative mb-12 inline-flex items-center gap-2">
					<h2 className="pr-2 font-semibold text-3xl md:text-5xl">
						<span className="text-dark-grey not-italic">Last Year&apos;s </span>
						<span className="text-awesomer-purple italic">Winners</span>
					</h2>
				</div>
				{children}
			</div>
		</SectionWrapper>
	);
};
