import Image from "next/image";

import type { CriteriaItemProps } from "@/types/landingPage";

export default function CriteriaItem({ text }: CriteriaItemProps) {
	return (
		<div className="flex items-center gap-4">
			<div className="flex h-15 w-15 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">
				<Image
					alt="Criteria Check Icon"
					height={24}
					src="/svgs/landingPage/criteria_check.svg"
					width={24}
				/>
			</div>
			<p className="break-words text-base text-dark-grey leading-relaxed">
				{text}
			</p>
		</div>
	);
}
