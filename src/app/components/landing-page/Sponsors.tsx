import Image from "next/image";
import Link from "next/link";
import type { Sponsor } from "@/types/landingPage";
import { sponsors } from "./data/sponsors";

// Gives every logo the same area rather than the same box, so wide and tall
// logos look equally big. --logo-size is relative to the tile, so logos keep
// the same proportions within their tiles at every screen size
function getLogoWidth({ width, height, scale = 1 }: Sponsor) {
	const factor = Math.sqrt(width / height) * scale;
	return `calc(var(--logo-size) * ${factor.toFixed(3)})`;
}

export default function Sponsors() {
	return (
		<section className="w-full overflow-hidden bg-white px-6 py-16 sm:px-12 md:py-24">
			<div className="flex flex-col items-center gap-12 md:gap-16">
				<div className="relative flex w-full flex-col items-center gap-4 py-6 text-center md:py-12">
					<Image
						alt=""
						className="-translate-y-1/2 -left-12 pointer-events-none absolute top-[35%] hidden sm:block"
						height={250}
						src="/svgs/landingPage/pink_line_left.svg"
						style={{ width: "32vw", height: "auto" }}
						width={600}
					/>

					<Image
						alt=""
						className="-translate-y-1/2 -right-12 pointer-events-none absolute top-[65%] hidden sm:block"
						height={250}
						src="/svgs/landingPage/pink_line_right.svg"
						style={{ width: "32vw", height: "auto" }}
						width={600}
					/>

					<h2 className="relative font-bold text-2xl sm:text-3xl md:text-4xl">
						Thank you to our sponsors
					</h2>
					<p className="relative max-w-md text-base text-dark-grey">
						Without their support, this event would not be possible.
					</p>
					<p className="relative text-base text-dark-grey">
						Interested in partnering? Contact{" "}
						<Link
							className="whitespace-nowrap text-awesomer-purple! underline transition-colors"
							href="mailto:codethechangeyyc@gmail.com"
						>
							codethechangeyyc@gmail.com
						</Link>
					</p>
				</div>

				{/* Two columns on phones and four from md up, so the eight logos fill
				    whole rows. Flex rather than grid keeps any short last row centred */}
				<ul className="flex w-full max-w-5xl flex-wrap justify-center gap-3 sm:gap-5 lg:gap-6">
					{sponsors.map((sponsor) => {
						const logo = (
							<span
								className="block transition-transform duration-300 group-hover:scale-105"
								style={{ width: getLogoWidth(sponsor) }}
							>
								<Image
									alt={sponsor.name}
									className="h-auto w-full"
									height={sponsor.height}
									sizes="(min-width: 768px) 12rem, 40vw"
									src={sponsor.image}
									width={sponsor.width}
								/>
							</span>
						);
						const tileClassName =
							"group @container flex aspect-3/2 w-full items-center justify-center rounded-2xl border-2 border-grey-200 bg-white transition-all duration-300 [--logo-size:34cqw]";

						return (
							<li
								className="w-[calc((100%-0.75rem)/2)] sm:w-[calc((100%-1.25rem)/2)] md:w-[calc((100%-3.75rem)/4)] lg:w-[calc((100%-4.5rem)/4)]"
								key={sponsor.id}
							>
								{sponsor.url ? (
									<Link
										className={`${tileClassName} hover:-translate-x-1 hover:-translate-y-1 hover:border-awesomer-purple hover:shadow-[6px_6px_0_0_var(--color-awesome-purple)] focus-visible:border-awesomer-purple focus-visible:outline-none`}
										href={sponsor.url}
										rel="noopener noreferrer"
										target="_blank"
										title={sponsor.name}
									>
										{logo}
									</Link>
								) : (
									<div className={tileClassName} title={sponsor.name}>
										{logo}
									</div>
								)}
							</li>
						);
					})}
				</ul>
			</div>
		</section>
	);
}
