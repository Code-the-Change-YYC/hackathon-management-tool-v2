import InfoSection from "./ui/InfoSection";

export default function Prizes() {
	return (
		<InfoSection
			bgColor="bg-fuzzy-peach"
			imageAlt="Prizes"
			imageSrc="/svgs/prizes.svg"
			paragraphs={[
				"Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
				"Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua."
			]}
			titleColor="text-dark-pink"
			titleHighlight="Prizes"
		/>
	);
}
