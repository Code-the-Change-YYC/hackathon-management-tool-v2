import type { Sponsor } from "@/types/landingPage";

// Logo files are cropped to the logo itself, with no surrounding whitespace,
// and width and height are their intrinsic sizes. scale nudges logos whose fine
// detail or heavy weight reads smaller or bigger than the rest at the same area.
export const sponsors: Sponsor[] = [
	{
		id: "sponsor-1",
		image: "/svgs/landingPage/sponsors/benevity-logo.png",
		width: 216,
		height: 59,
		name: "Benevity",
		url: "https://benevity.com/"
	},
	{
		id: "sponsor-2",
		image: "/svgs/landingPage/sponsors/clio-logo.png",
		width: 497,
		height: 158,
		scale: 0.9,
		name: "Clio",
		url: "https://www.clio.com/ca/"
	},
	{
		id: "sponsor-3",
		image: "/svgs/landingPage/sponsors/aws-logo.svg",
		width: 305,
		height: 180,
		scale: 0.9,
		name: "AWS",
		url: "https://aws.amazon.com/"
	},
	{
		id: "sponsor-4",
		image: "/svgs/landingPage/sponsors/schulich-logo.jpg",
		width: 153,
		height: 194,
		scale: 1.05,
		name: "Schulich School of Engineering",
		url: "https://schulich.ucalgary.ca/"
	},
	{
		id: "sponsor-5",
		image: "/svgs/landingPage/sponsors/faculty-of-science-logo.png",
		width: 359,
		height: 156,
		scale: 1.15,
		name: "University of Calgary - Faculty of Science",
		url: "https://science.ucalgary.ca/"
	},
	{
		id: "sponsor-6",
		image: "/svgs/landingPage/sponsors/cs_ucalgary.png",
		width: 400,
		height: 156,
		scale: 1.15,
		name: "University of Calgary - Department of Computer Science",
		url: "https://science.ucalgary.ca/computer-science"
	},
	{
		id: "sponsor-7",
		image: "/svgs/landingPage/sponsors/pason-logo.png",
		width: 395,
		height: 136,
		name: "Pason",
		url: "https://pason.com/"
	},
	{
		id: "sponsor-8",
		image: "/svgs/landingPage/sponsors/voltex-logo.png",
		width: 359,
		height: 156,
		scale: 1.15,
		name: "Voltex Solutions",
		url: "https://voltex.ca/"
	}
];
