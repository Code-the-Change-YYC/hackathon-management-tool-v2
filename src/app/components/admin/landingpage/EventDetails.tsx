import { eventInfoItems } from "./data/eventInfo";
import EventDetailsItem from "./ui/EventDetailsItem";

export default function EventDetails() {
	return (
		<section className="w-full bg-white px-6 py-12 sm:px-12">
			<div className="relative mx-auto max-w-3xl">
				<div className="absolute inset-0 translate-x-3 translate-y-3 rounded-2xl bg-dark-pink" />

				<div className="relative flex flex-col overflow-hidden rounded-2xl border-3 border-dark-pink bg-pastel-pink md:flex-row">
					<div className="h-48 w-full bg-dark-grey md:h-auto md:w-2/5" />

					<div className="flex flex-col gap-4 px-10 py-5">
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
