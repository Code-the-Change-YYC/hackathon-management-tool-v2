import Image from "next/image";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const SVGS = {
	green_squiggle:
		"svgs/landingPage/hackathonInformationContainer/green_squiggle.svg",
	green_squiggle2:
		"svgs/landingPage/hackathonInformationContainer/green_squiggle2.svg",
	green_squiggle3:
		"svgs/landingPage/hackathonInformationContainer/green_squiggle3.svg",
	green_squiggle4:
		"svgs/landingPage/hackathonInformationContainer/green_squiggle4.svg",
	pink_squiggle:
		"svgs/landingPage/hackathonInformationContainer/pink_squiggle.svg",
	pink_squiggle2:
		"svgs/landingPage/hackathonInformationContainer/pink_squiggle2.svg",
	purple_squiggle:
		"svgs/landingPage/hackathonInformationContainer/purple_squiggle.svg"
} as const;

export default function HackathonInformationContainer({
	children
}: {
	children: ReactNode;
}) {
	return (
		<div className="relative overflow-hidden">
			<SquiggleContainer>
				<Squiggle className="-left-30 top-10 w-1/4" src={"pink_squiggle"} />
				<Squiggle className="top-130 left-5 w-1/2" src={"green_squiggle"} />
				<Squiggle className="top-240 left-5 w-full" src={"purple_squiggle"} />
				<Squiggle className="top-240 left-5 w-full" src={"green_squiggle2"} />
				<Squiggle className="top-440 left-190 w-1/3" src={"green_squiggle3"} />
			</SquiggleContainer>
			{children}
		</div>
	);
}

function Squiggle({
	src,
	className
}: {
	src: keyof typeof SVGS;
	className?: string;
}) {
	return (
		<Image
			alt={src}
			className={cn(`${className} absolute`)}
			height={0}
			src={SVGS[src]}
			width={0}
		/>
	);
}
function SquiggleContainer({ children }: { children: ReactNode }) {
	return (
		<div className="pointer-events-none hidden w-full select-none justify-center lg:flex">
			<div className="relative w-full max-w-7xl">{children}</div>
		</div>
	);
}
