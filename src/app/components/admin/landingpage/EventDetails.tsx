import Image from "next/image";
import { eventInfoItems } from "./data/eventInfo";
import EventDetailsItem from "./ui/EventDetailsItem";

export default function EventDetails() {
	return (
		<section className="w-full bg-white pt-37.5 pr-10 pb-31.25 pl-10 md:pr-28.75 md:pl-27.25">
			<div className="relative h-110">
				<div className="absolute inset-0 translate-x-3 translate-y-3 rounded-[30px] bg-medium-pink" />

				<div className="absolute inset-0 flex overflow-hidden rounded-[33px] border-[7px] border-dark-pink bg-pastel-pink">
					<div className="relative w-152.5 shrink-0 overflow-hidden rounded-3xl border-4 border-dark-pink bg-dark-grey">
						<Image
							alt="Event image"
							className="h-full w-full object-cover"
							fill
							src="/svgs/landingPage/event_room.jpg"
						/>
					</div>

					<div className="flex flex-1 flex-col justify-center gap-8 px-12">
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
		</section>
	);
}
