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

				<div className="flex w-full items-center justify-between px-[84px]">
					{sponsors.map((sponsor) => (
						<div
							className="h-20 w-20 shrink-0 overflow-hidden rounded-full bg-medium-grey"
							key={sponsor.id}
						>
							<Image
								alt={sponsor.name}
								className="h-full w-full object-cover"
								height={80}
								src={sponsor.image}
								width={80}
							/>
						</div>
					))}
				</div>
			</div>
		</section>
	);
}
