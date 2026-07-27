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
			paragraphs={["Open to all Canadian students, at any level of study."]}
			title=""
			titleColor="text-awesomer-purple"
			titleHighlight="Requirements"
		/>
	);
}
