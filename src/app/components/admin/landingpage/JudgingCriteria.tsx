import { CheckCircleLine } from "@mingcute/react";
import { getCriteria } from "@/app/actions";
import InfoSection from "./ui/InfoSection";

export default async function JudgingCriteria() {
	const criteria = await getCriteria();

	const CriteriaList = () => (
		<ul className="flex flex-col gap-5 px-0 sm:px-4 md:px-10">
			{criteria.map((criterion) => (
				<li
					className="flex items-center gap-4 sm:gap-6 md:gap-6.5"
					key={criterion.id}
				>
					<div className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-white p-4 sm:size-20 sm:rounded-[25px] sm:p-5">
						<CheckCircleLine
							aria-hidden="true"
							className="size-8 text-dark-grey sm:size-10"
							size={40}
						/>
					</div>

					<div className="min-w-0 flex-1 font-medium text-base text-dark-grey leading-6 sm:text-lg sm:leading-7">
						<h3>{criterion.name}</h3>
						{criterion.description && <p>{criterion.description}</p>}
					</div>
				</li>
			))}
		</ul>
	);
	return (
		<InfoSection
			accentPosition="after"
			accentSrc="accent_green"
			bgColor="bg-pastel-green"
			bodyContent={criteria.length ? <CriteriaList /> : <NotAvailable />}
			bodyTextColor="text-dark-grey"
			title="Judging"
			titleColor="text-awesomer-purple"
			titleHighlight="Criteria"
			titlePrefixColor="text-black"
		/>
	);
}

const NotAvailable = () => (
	<p className="text-dark-grey">Judging criteria are currently unavailable.</p>
);
