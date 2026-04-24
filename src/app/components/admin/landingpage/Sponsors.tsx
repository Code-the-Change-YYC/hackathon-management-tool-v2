import Image from "next/image";
import { sponsors } from "./data/sponsors";

export default function Sponsors() {
	return (
		<section className="w-full bg-white px-12 py-10">
			<div className="flex flex-col items-center gap-2">
				<h2 className="text-center font-bold text-2xl">
					Thank you to our sponsors
				</h2>
				<p className="max-w-sm text-center text-dark-grey text-sm">
					Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
					eiusmod tempor incididunt ut labore et dolore magna aliqua.
				</p>
			</div>

			<div className="mt-12 flex flex-wrap items-center justify-center gap-12">
				{sponsors.map((sponsor) => (
					<div
						className="h-16 w-16 shrink-0 overflow-hidden rounded-full bg-medium-grey"
						key={sponsor.id}
					>
						<Image
							alt={sponsor.name}
							className="h-full w-full object-cover"
							height={64}
							src={sponsor.image}
							width={64}
						/>
					</div>
				))}
			</div>
		</section>
	);
}
