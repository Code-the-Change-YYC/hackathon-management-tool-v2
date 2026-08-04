import Image from "next/image";
import type { EventDetailProps } from "@/types/landingPage";

export default function EventDetailsItem({ icon, label }: EventDetailProps) {
	return (
		<div className="group flex items-center gap-3 rounded-3xl bg-white/50 p-3 transition-all duration-300 md:gap-4 md:p-4">
			<div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white shadow-md transition-transform duration-300 group-hover:scale-110 md:h-16 md:w-16">
				<Image alt={label} height={24} src={icon} width={24} />
			</div>
			<span className="font-extrabold text-base text-dark-grey md:text-xl">
				{label}
			</span>
		</div>
	);
}
