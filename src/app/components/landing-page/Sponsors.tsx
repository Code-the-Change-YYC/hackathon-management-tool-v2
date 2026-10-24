import Image from "next/image";
import Link from "next/link";
import type { Sponsor } from "@/types/landingPage";
import { sponsors } from "./data/sponsors";

// Gives every logo the same area rather than the same box, so wide and tall
// logos look equally big
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

				<div className="grid w-full max-w-4xl grid-cols-2 gap-x-6 gap-y-8 [--logo-size:4rem] sm:grid-cols-3 xl:max-w-7xl xl:grid-cols-6 sm:[--logo-size:5rem] md:[--logo-size:5.5rem]">
					{sponsors.map((sponsor) => {
						const logo = (
							<Image
								alt={sponsor.name}
								className="h-auto w-full"
								height={sponsor.height}
								sizes="11rem"
								src={sponsor.image}
								width={sponsor.width}
							/>
						);
						const logoClassName =
							"group-hover:-translate-y-1 block max-w-full transition-transform duration-300";
						const logoStyle = { width: getLogoWidth(sponsor) };

						return (
							<div
								className="group flex flex-col items-center gap-2"
								key={sponsor.id}
							>
								<div className="flex h-[calc(var(--logo-size)*1.5)] w-full items-center justify-center">
									{sponsor.url ? (
										<Link
											className={logoClassName}
											href={sponsor.url}
											rel="noopener noreferrer"
											style={logoStyle}
											target="_blank"
										>
											{logo}
										</Link>
									) : (
										<div className={logoClassName} style={logoStyle}>
											{logo}
										</div>
									)}
								</div>
								{/* Revealed on hover, so only shown where hovering is common */}
								<p className="hidden text-center font-medium text-dark-grey text-sm opacity-0 transition-all duration-300 group-hover:opacity-100 lg:block">
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
