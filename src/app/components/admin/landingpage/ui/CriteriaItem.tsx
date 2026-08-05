import Image from "next/image";

import type { CriteriaItemProps } from "@/types/landingPage";

export default function CriteriaItem({ category, text }: CriteriaItemProps) {
	return (
		<div className="group flex flex-col items-start rounded-2xl bg-white/80 p-6 shadow-lg backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-2xl lg:p-8">
			<div className="mb-4 flex w-full items-center gap-4">
				<div className="flex h-15 w-15 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm transition-transform duration-300 group-hover:scale-110">
					<Image
						alt="Criteria Check Icon"
						height={24}
						src="/svgs/landingPage/criteria_check.svg"
						width={24}
					/>
				</div>
				<h3 className="font-bold text-2xl text-dark-grey">{category}</h3>
			</div>
			<p className="wrap-break-word text-base text-dark-grey/80 leading-relaxed lg:text-lg">
				{text}
			</p>
		</div>
	);
}
