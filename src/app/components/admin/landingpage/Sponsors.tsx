import Image from "next/image";
import { sponsors } from "./data/sponsors";

export default function Sponsors() {
	return (
		<section className="relative w-full overflow-hidden bg-white py-[40px]">
			<Image
				alt=""
				className="-translate-y-1/2 pointer-events-none absolute top-[20%] left-0 hidden sm:block"
				height={250}
				src="/svgs/landingPage/pink_line_left.svg"
				style={{ width: "35vw", height: "auto" }}
				width={600}
			/>

			<Image
				alt=""
				className="-translate-y-1/2 pointer-events-none absolute top-[30%] right-0 hidden sm:block"
				height={250}
				src="/svgs/landingPage/pink_line_right.svg"
				style={{ width: "35vw", height: "auto" }}
				width={600}
			/>

			<div className="relative flex flex-col items-center gap-[84px]">
				<div className="flex flex-col items-center gap-4">
					<h2 className="text-center font-bold text-3xl">
						Thank you to our sponsors
					</h2>
					<p className="max-w-md text-center text-base text-dark-grey">
						Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
						eiusmod tempor incididunt ut labore et dolore magna aliqua.
					</p>
				</div>

				<div className="flex w-full flex-wrap items-center justify-between gap-x-8 gap-y-6 px-[84px]">
					{sponsors.map((sponsor) => (
						<div
							className="flex h-16 w-auto max-w-[140px] shrink-0 items-center justify-center"
							key={sponsor.id}
						>
							<Image
								alt={sponsor.name}
								className="h-full w-full object-contain"
								height={64}
								src={sponsor.image}
								width={140}
							/>
						</div>
					))}
				</div>
			</div>
		</section>
	);
}
