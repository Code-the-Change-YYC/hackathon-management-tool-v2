import InfoSection, { Squiggle } from "./InfoSection";

export default function AboutChallenge() {
	return (
		<InfoSection
			accentPosition="after"
			accentSrc="accent_pink"
			bgColor="bg-awesomer-purple"
			bodyTextColor="text-pale-grey"
			decoration={
				<>
					<Squiggle className="-top-16 -left-40 w-64" src="pink_squiggle" />
					<Squiggle
						className="-left-28 top-[calc(100%+2rem)] w-80"
						src="green_squiggle"
					/>
				</>
			}
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
