import InfoSection from "./ui/InfoSection";

export default function Requirements() {
	return (
		<InfoSection
			bgColor="bg-pale-grey"
			imageAlt="Requirements"
			imageSrc="/svgs/requirements.svg"
			paragraphs={[
				"Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
				"Lorem ipsum dolasdasor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua."
			]}
			reverse
			titleColor="text-awesomer-purple"
			titleHighlight="Requirements"
		/>
	);
}
