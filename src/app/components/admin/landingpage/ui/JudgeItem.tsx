import Image from "next/image";
import { getAssetUrl, getFields, getString } from "@/lib/contentful";
import type { Judge } from "@/types/contentfulTypes";

function getInitials(name: string): string {
	return name
		.split(/\s+/)
		.map((part) => part[0])
		.filter(Boolean)
		.slice(0, 2)
		.join("")
		.toUpperCase();
}

export default function JudgeItem({ judge }: { judge: Judge }) {
	const fields = getFields(judge);
	const company = getString(fields.judgeCompany)?.trim() ?? "";
	const image = getAssetUrl(fields.judgeImg);
	const name = getString(fields.judgeName)?.trim() ?? "Judge";
	const imageAlt = `${name} profile photo`;

	return (
		<div
			className="flex items-center gap-4 lg:gap-9.25"
			data-testid="judge-card"
		>
			<div className="flex size-20.75 shrink-0 items-center justify-center overflow-hidden rounded-full bg-medium-grey text-awesomer-purple text-xl lg:size-[125px] lg:text-3xl">
				{image ? (
					<Image
						alt={imageAlt}
						className="h-full w-full object-cover"
						height={125}
						src={image}
						width={125}
					/>
				) : (
					<span aria-label={`${name} profile photo unavailable`} role="img">
						{getInitials(name)}
					</span>
				)}
			</div>
			<div className="flex min-w-0 flex-col gap-1">
				<span className="font-semibold text-awesomer-purple text-base lg:text-[25px]">
					{name}
				</span>
				<span className="text-base text-dark-grey lg:text-[25px]">
					{company}
				</span>
			</div>
		</div>
	);
}
