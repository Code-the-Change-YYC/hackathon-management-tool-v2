import InfoSection from "./ui/InfoSection";

export default function AboutChallenge() {
	return (
		<InfoSection
			accentPosition="after"
			accentSrc="/svgs/landingPage/accent_pink.svg"
			bgColor="bg-awesomer-purple"
			bodyTextColor="text-pale-grey"
			imageAlt="About the challenge"
			imageSrc="/svgs/landingPage/about_illustration.svg"
			paragraphs={[
				"Lorem ipsum dolor sit amet, chjhonsectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
				"Lorem ipsum dolor sit amet, consectetur adipiscing elsafasfit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua."
			]}
			reverse
			title="About the"
			titleColor="text-pastel-pink"
			titleHighlight="Challenge"
		/>
	);
}
