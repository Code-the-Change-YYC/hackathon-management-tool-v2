import Image from "next/image";
import Link from "next/link";
import { eventInfoItems } from "./data/eventInfo";
import EventDetailsItem from "./ui/EventDetailsItem";

const EVENT_LOCATION_LINK = "https://share.google/YAkQs91U42vi1x1t4";

export default function EventDetails() {
	return (
		<section className="flex w-full flex-col items-center bg-white px-6 py-10 md:px-20 md:py-20">
			<div className="relative w-[92%]">
				<div className="absolute inset-0 translate-x-3 translate-y-3 rounded-[30px] bg-medium-pink" />

				<div className="relative flex min-h-[500px] flex-col overflow-hidden rounded-[33px] border-[7px] border-dark-pink bg-pastel-pink lg:flex-row">
					<Link
						className="relative h-56 w-full shrink-0 overflow-hidden rounded-3xl border-4 border-dark-pink bg-dark-grey lg:h-auto lg:w-2/5"
						href={EVENT_LOCATION_LINK}
						target="_blank"
					>
						<Image
							alt="Event image"
							className="h-full w-full object-cover"
							fill
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
