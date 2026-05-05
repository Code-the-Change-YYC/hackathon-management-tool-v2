import Image from "next/image";

type JudgeItemProps = {
	name: string;
	company: string;
	image: string;
};

export default function JudgeItem({ company, image, name }: JudgeItemProps) {
	return (
		<div className="flex items-center gap-3">
			<div className="h-14 w-14 shrink-0 overflow-hidden rounded-full bg-medium-grey">
				<Image
					alt={name}
					className="h-full w-full object-cover"
					height={56}
					src={image}
					width={56}
				/>
			</div>
			<div className="flex flex-col">
				<span className="font-bold text-awesomer-purple text-sm">{name}</span>
				<span className="text-dark-grey text-sm">{company}</span>
			</div>
		</div>
	);
}
