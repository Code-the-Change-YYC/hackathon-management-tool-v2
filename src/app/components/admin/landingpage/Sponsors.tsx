import Image from "next/image";
import Link from "next/link";
import { sponsors } from "./data/sponsors";

export default function Sponsors() {
	return (
		<section className="w-full bg-white py-10">
			<div className="relative flex flex-col items-center gap-21">
				<div className="relative flex w-full flex-col items-center gap-4 overflow-hidden py-12">
					<Image
						alt=""
						className="-translate-y-1/2 pointer-events-none absolute top-[35%] left-0 hidden sm:block"
						height={250}
						src="/svgs/landingPage/pink_line_left.svg"
						style={{ width: "32vw", height: "auto" }}
						width={600}
					/>

					<Image
						alt=""
						className="-translate-y-1/2 pointer-events-none absolute top-[65%] right-0 hidden sm:block"
						height={250}
						src="/svgs/landingPage/pink_line_right.svg"
						style={{ width: "32vw", height: "auto" }}
						width={600}
					/>

					<h2 className="relative text-center font-bold text-3xl md:text-4xl">
						Thank you to our sponsors
					</h2>
					<p className="relative w-1/2 text-center text-base">
						{`Without their support, this event would not be possible.`}
					</p>
					<p className="relative text-cente">
						Interested in partnering? Contact{" "}
						<Link
							className="text-awesomer-purple! underline transition-colors"
							href="mailto:codethechangeyyc@gmail.com"
						>
							codethechangeyyc@gmail.com
						</Link>
					</p>
				</div>

				<div className="grid w-full grid-cols-2 gap-x-8 gap-y-10 px-21 md:grid-cols-4">
					{sponsors.map((sponsor) => {
						const logo = (
							<div className="group-hover:-translate-y-1 flex size-32 items-center justify-center overflow-hidden rounded-full bg-white transition-all duration-300 group-hover:shadow-2xl md:size-37.5">
								<Image
									alt={sponsor.name}
									className="h-full w-full scale-75 object-contain"
									height={150}
									src={sponsor.image}
									width={150}
								/>
							</div>
						);

						return (
							<div
								className="group flex flex-col items-center justify-center gap-3"
								key={sponsor.id}
							>
								{sponsor.url ? (
									<Link
										href={sponsor.url}
										rel="noopener noreferrer"
										target="_blank"
									>
										{logo}
									</Link>
								) : (
									logo
								)}
								<p className="text-center text-dark-grey text-sm opacity-0 transition-all duration-300 group-hover:opacity-100">
									{sponsor.name}
								</p>
							</div>
						);
					})}
				</div>
			</div>
		</section>
	);
}
