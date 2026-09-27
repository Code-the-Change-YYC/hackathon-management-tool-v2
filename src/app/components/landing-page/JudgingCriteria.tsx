import { CheckCircleLine } from "@mingcute/react";
import { getCriteria } from "@/app/actions";
import InfoSection from "./InfoSection";

export default async function JudgingCriteria() {
	const criteria = await getCriteria();

	return (
		<InfoSection
			accentPosition="after"
			accentSrc="accent_green"
			bgColor="bg-pastel-green"
			bodyContent={
				criteria.length ? (
					<ul className="mt-6 flex max-w-4xl flex-col gap-6 sm:px-4 md:px-10">
						{criteria.map((criterion) => (
							<li
								className="flex items-start gap-4 sm:items-center sm:gap-6"
								key={criterion.id}
							>
								<div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-white sm:size-20 sm:rounded-[25px]">
									<CheckCircleLine
										aria-hidden="true"
										className="size-7 text-primary sm:size-10"
										size={40}
									/>
								</div>

								<div className="min-w-0 flex-1 font-medium text-base text-dark-grey leading-6 sm:text-lg sm:leading-7">
									<h3 className="font-semibold text-lg sm:text-2xl">
										{criterion.name}
									</h3>
									{criterion.description && <p>{criterion.description}</p>}
								</div>
							</li>
						))}
					</ul>
				) : (
					<p className="text-dark-grey">
						Judging criteria are currently unavailable.
					</p>
				)
			}
			bodyTextColor="text-dark-grey"
			title="Judging"
			titleColor="text-awesomer-purple"
			titleHighlight="Criteria"
			titlePrefixColor="text-black"
		/>
	);
}
