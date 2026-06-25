import InfoSection from "./ui/InfoSection";

export default function Requirements() {
	return (
		<InfoSection
			accentPosition="before"
			accentSrc="/svgs/landingPage/accent_purple.svg"
			bgColor="bg-light-grey"
			bodyTextColor="text-dark-grey"
			imageAlt="Requirements"
			imageSrc="/svgs/landingPage/requirements_illustration.svg"
			paragraphs={[
				"Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
				"Lorem ipsum dolor sit amet, consectetur adipiscihjfhjfng elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua."
			]}
			title=""
			titleColor="text-awesomer-purple"
			titleHighlight="Requirements"
		/>
	);
}
