import Image from "next/image";

type CriteriaItemProps = {
	text: string;
};

export default function CriteriaItem({ text }: CriteriaItemProps) {
	return (
		<div className="flex items-center gap-4">
			<div className="flex h-15 w-15 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">
				<Image
					alt="Team Icon"
					height={24}
					src="/svgs/judges/team_icon.svg"
					width={24}
				/>
			</div>
			<p className="text-dark-grey text-sm">{text}</p>
		</div>
	);
}
