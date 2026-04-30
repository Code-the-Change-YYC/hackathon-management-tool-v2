import Image from "next/image";

type EventDetailProps = {
	icon: string;
	label: string;
};

export default function EventDetailsItem({ icon, label }: EventDetailProps) {
	return (
		<div className="flex items-center gap-3">
			<div className="flex h-15 w-15 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">
				<Image alt={label} height={12} src={icon} width={12} />
			</div>
			<span className="font-extrabold text-base text-dark-grey">{label}</span>
		</div>
	);
}
