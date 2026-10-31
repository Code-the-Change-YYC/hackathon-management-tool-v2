import Image from "next/image";
import Carousel from "@/components/ImportantInfo/carousel";
import FaqInfo from "@/components/ImportantInfo/faqInfo";
import ProjectSubmission from "@/components/ImportantInfo/projectSubmission";

export default function ImportantInfo() {
	return (
		<div className="relative flex w-full flex-col items-center justify-center overflow-hidden bg-pastel-pink">
			<Image
				alt="White stars"
				className="pointer-events-none absolute top-96 left-4 md:top-52 md:left-24 lg:top-60 lg:left-36"
				height={30}
				src="/svgs/importantInfo/starIcons.svg"
				width={30}
			/>
			<Image
				alt="White stars"
				className="pointer-events-none absolute top-[870px] right-4 md:top-[760px] md:right-20 lg:top-[730px] lg:right-28"
				height={30}
				src="/svgs/importantInfo/starIcons.svg"
				width={30}
			/>
			<div className="flex w-full flex-row items-center justify-center gap-2 md:gap-6">
				<Image
					alt="Left Pink Squiggly"
					className="pointer-events-none mt-8 h-auto w-[20vw] max-w-96 opacity-0 md:opacity-100 lg:mt-14 xl:mt-20"
					height={0}
					src="/svgs/importantInfo/leftPinkSquiggly.svg"
					width={0}
				/>
				<h1 className="mx-4 mt-10 whitespace-nowrap text-wrap text-center text-4xl text-white md:mt-8 md:text-7xl lg:mt-10 xl:mt-16">
					Important Information
				</h1>
				<Image
					alt="Right Pink Squiggly"
					className="-mt-2 pointer-events-none h-auto w-[20vw] max-w-96 opacity-0 md:opacity-100"
					height={0}
					src="/svgs/importantInfo/rightPinkSquiggly.svg"
					width={0}
				/>
			</div>

			<div className="mt-8 flex flex-wrap items-center justify-center gap-4 md:gap-8">
				<a
					className="rounded-full bg-white px-6 py-3 font-semibold text-awesome-purple text-lg shadow-lg transition-all hover:scale-105 hover:bg-awesomer-purple hover:text-white md:px-7 md:py-4 md:text-xl"
					href="/participant/rubric"
				>
					Rubric
				</a>
				<a
					className="rounded-full bg-white px-5 py-3 font-semibold text-awesome-purple text-lg shadow-lg transition-all hover:scale-105 hover:bg-awesomer-purple hover:text-white md:px-6 md:py-4 md:text-xl"
					href={process.env.NEXT_PUBLIC_DEVPOST_LINK}
					rel="noopener noreferrer"
					target="_blank"
				>
					Devpost
				</a>
				<a
					className="rounded-full bg-white px-5 py-3 font-semibold text-awesome-purple text-lg shadow-lg transition-all hover:scale-105 hover:bg-awesomer-purple hover:text-white md:px-6 md:py-4 md:text-xl"
					href={process.env.NEXT_PUBLIC_DISCORD_LINK}
					rel="noopener noreferrer"
					target="_blank"
				>
					Discord
				</a>
			</div>

			<p className="mx-6 my-14 text-center font-semibold text-grey-purple/70 text-xl">
				Here are the rules, code of conduct, steps to submit your project, tips
				for success, and answers to frequently asked questions (FAQs)!
			</p>
			<Carousel />
			<ProjectSubmission />
			<FaqInfo />
		</div>
	);
}
