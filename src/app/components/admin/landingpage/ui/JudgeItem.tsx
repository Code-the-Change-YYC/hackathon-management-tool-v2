import Image from "next/image";
import type { JudgeItemProps } from "@/types/landingPage";

export default function JudgeItem({ company, image, name }: JudgeItemProps) {
	return (
		<div className="flex items-center gap-4">
			<div className="h-[83px] w-[83px] shrink-0 overflow-hidden rounded-full bg-medium-grey">
				<Image
					alt={name}
					className="h-full w-full object-cover"
					height={83}
					src={image}
					width={83}
				/>
			</div>
			<div className="flex flex-col gap-1">
				<span className="font-bold text-awesomer-purple text-base">{name}</span>
				<span className="text-base text-dark-grey">{company}</span>
			</div>
		</div>
	);
}
