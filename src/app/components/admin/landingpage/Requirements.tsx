import InfoSection from "./ui/InfoSection";

export default function Requirements() {
	return (
		<InfoSection
			accentPosition="before"
			accentSrc="accent_purple"
			bgColor="bg-light-grey"
			bodyTextColor="text-dark-grey"
			imageAlt="Requirements"
			imageSrc="/svgs/landingPage/requirements_illustration.svg"
			paragraphs={[
				"Open to all Canadian students, at the university, college, or high school level."
			]}
			title=""
			titleColor="text-awesomer-purple"
			titleHighlight="Requirements"
		/>
	);
}
