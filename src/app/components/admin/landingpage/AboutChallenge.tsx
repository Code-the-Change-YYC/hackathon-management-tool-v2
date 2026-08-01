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
				"Hack the Change is a 24-hour event where students from across Canada come together to build innovative software solutions that create positive social impact.",
				"Whether you are a first-time hacker or a seasoned veteran, the hackathon inspires participants to leverage technology, solve real-world problems, and code a better tomorrow."
			]}
			reverse
			title="About the"
			titleColor="text-pastel-pink"
			titleHighlight="Challenge"
		/>
	);
}
