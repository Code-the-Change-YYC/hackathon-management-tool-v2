import Image from "next/image";
import Link from "next/link";
import type { MingCuteIcon } from "@/types/landingPage";
import { eventInfoItems } from "./data/eventInfo";

type EventDetailProps = {
	icon: MingCuteIcon;
	label: string;
};

function EventDetailsItem({ icon, label }: EventDetailProps) {
	const Icon = icon;

	return (
		<div className="group flex flex-col items-center gap-3 rounded-3xl bg-white/50 p-3 transition-all duration-300 sm:flex-row md:gap-4 md:p-4">
			<div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-dark-pink transition-transform duration-300 group-hover:scale-110 md:h-16 md:w-16">
				<Icon aria-hidden="true" size={24} />
			</div>
			<span className="text-center font-semibold text-base text-dark-grey md:text-xl">
				{label}
			</span>
		</div>
	);
}

const EVENT_LOCATION_LINK = "https://share.google/YAkQs91U42vi1x1t4";

export default function EventDetails() {
	return (
		<section className="flex w-full flex-col items-center bg-white px-6 py-14 sm:px-12 md:py-20 lg:px-20">
			<div className="relative w-full">
				<div className="absolute inset-0 translate-x-3 translate-y-3 rounded-[30px] bg-medium-pink" />

				<div className="relative flex flex-col overflow-hidden rounded-[33px] border-[7px] border-dark-pink bg-pastel-pink lg:min-h-125 lg:flex-row">
					<Link
						aria-label="View the event location on Google Maps"
						className="relative h-56 w-full shrink-0 overflow-hidden rounded-3xl border-4 border-dark-pink bg-dark-grey sm:h-72 lg:h-auto lg:w-2/5"
						href={EVENT_LOCATION_LINK}
						rel="noopener noreferrer"
						target="_blank"
					>
						<Image
							alt="University of Calgary engineering building"
							className="h-full w-full object-cover"
							fill
							loading="eager"
							sizes="(min-width: 1024px) 40vw, 100vw"
							src="/svgs/landingPage/event_room.jpg"
						/>
					</Link>

					<div className="flex flex-1 flex-col justify-center gap-4 p-6 md:gap-6 md:p-12">
						<div className="grid grid-cols-2 gap-4 md:gap-6 lg:grid-cols-1">
							{eventInfoItems.map((item) => (
								<EventDetailsItem
									icon={item.icon}
									key={item.id}
									label={item.label}
								/>
							))}
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}
