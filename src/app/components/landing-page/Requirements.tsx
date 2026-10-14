import InfoSection, { Squiggle } from "./InfoSection";

export default function Requirements() {
	return (
		<InfoSection
			accentPosition="before"
			accentSrc="accent_purple"
			bgColor="bg-light-grey"
			bodyTextColor="text-dark-grey"
			decoration={
				<>
					<Squiggle
						className="top-[calc(100%+1rem)] left-0 w-1/2"
						src="purple_squiggle"
					/>
					<Squiggle
						className="top-[calc(100%+1.5rem)] right-0 w-80"
						src="green_squiggle2"
					/>
				</>
			}
			imageAlt="Requirements"
			imageSrc="/svgs/landingPage/requirements_illustration.svg"
			paragraphs={[
				"Open to all Canadian students, at the university, college, or high school level."
			]}
			titleColor="text-awesomer-purple"
			titleHighlight="Requirements"
		/>
	);
}
