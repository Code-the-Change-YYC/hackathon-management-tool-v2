import { getCriteria } from "@/app/actions";
import { SectionTitle, SectionWrapper } from "./InfoSection";

export default async function JudgingCriteria() {
	const criteria = await getCriteria();

	return (
		<SectionWrapper bgColor="bg-pastel-green">
			<div
				className="flex w-full flex-col gap-10 md:gap-14"
				id="judging-criteria"
			>
				<div className="flex flex-col gap-4">
					<SectionTitle
						accentPosition="after"
						accentSrc="accent_green"
						title="Judging"
						titleColor="text-awesomer-purple"
						titleHighlight="Criteria"
						titlePrefixColor="text-black"
					/>
					<p className="font-medium text-dark-grey text-lg md:text-xl">
						Our judges score every project on the criteria below.
					</p>
				</div>

				{criteria.length === 0 && (
					<p className="text-dark-grey">
						Judging criteria are currently unavailable.
					</p>
				)}

				{criteria.length > 0 && (
					<ol className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:gap-8">
						{criteria.map((criterion, index) => (
							<li
								className="flex flex-col gap-3 rounded-[30px] bg-white p-6 shadow-[8px_8px_0_0_var(--color-dark-green)] md:p-8"
								key={criterion.id}
							>
								<div className="flex items-center justify-between gap-4">
									<span className="font-bold text-4xl text-awesomer-purple italic md:text-5xl">
										{String(index + 1).padStart(2, "0")}
									</span>
								</div>
								<h3 className="font-semibold text-dark-grey text-xl md:text-2xl">
									{criterion.name}
								</h3>
								{criterion.description && (
									<p className="text-base text-dark-grey/80 leading-7 md:text-lg">
										{criterion.description}
									</p>
								)}
							</li>
						))}
					</ol>
				)}
			</div>
		</SectionWrapper>
	);
}
