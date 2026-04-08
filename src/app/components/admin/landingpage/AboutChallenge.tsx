import InfoSection from "./ui/InfoSection";

export default function AboutChallenge() {
	return (
		<InfoSection
			bgColor="bg-awesomer-purple"
			bodyTextColor="text-pale-grey"
			imageAlt="About the challenge"
			imageSrc="/svgs/about-challenge.svg"
			paragraphs={[
				"Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
				"Lorem ipsum dolor sit amet, consectetur adipiscing elsafasfit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua."
			]}
			title="About the"
			titleColor="text-pastel-pink"
			titleHighlight="Challenge"
		/>
	);
}
