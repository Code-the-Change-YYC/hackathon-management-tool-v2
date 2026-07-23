import Image from "next/image";
import AboutChallenge from "./AboutChallenge";
import Prizes from "./Prizes";
import Requirements from "./Requirements";

export default function InfoSections() {
	return (
		<div className="relative">
			<Image
				alt=""
				className="pointer-events-none absolute inset-0 h-full w-full object-contain"
				fill
				src="/svgs/landingPage/connecting_strings.svg"
				style={{ zIndex: 1 }}
			/>
			<AboutChallenge />
			<Requirements />
			<Prizes />
		</div>
	);
}
