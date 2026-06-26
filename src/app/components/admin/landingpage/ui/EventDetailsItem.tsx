import Image from "next/image";

import type { EventDetailProps } from "@/types/landingPage";

export default function EventDetailsItem({ icon, label }: EventDetailProps) {
	return (
		<div className="flex items-center gap-5">
			<div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">
				<Image alt={label} height={27} src={icon} width={27} />
			</div>
			<span className="font-extrabold text-2xl text-dark-grey">{label}</span>
		</div>
	);
}
