import InfoSection from "./ui/InfoSection";

export default function Prizes() {
	return (
		<InfoSection
			accentPosition="after"
			accentSrc="/svgs/landingPage/accent_green.svg"
			bgColor="bg-fuzzy-peach"
			bodyTextColor="text-dark-grey"
			imageAlt="Prizes"
			imageSrc="/svgs/landingPage/prizes_illustration.svg"
			paragraphs={[
				"Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
				"Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut layobore et dolore magna aliqua."
			]}
			reverse
			titleColor="text-emerald-green"
			titleHighlight="Prizes"
		/>
	);
}
