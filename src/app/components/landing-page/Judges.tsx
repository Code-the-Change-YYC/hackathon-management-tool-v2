import Image from "next/image";
import { getJudges } from "@/app/actions";
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

function JudgeItem({ judge }: { judge: Judge }) {
	const fields = getFields(judge);
	const company = getString(fields.judgeCompany)?.trim() ?? "";
	const image = getAssetUrl(fields.judgeImg);
	const name = getString(fields.judgeName)?.trim() ?? "Judge";
	const imageAlt = `${name} profile photo`;

	return (
		<div
			className="flex flex-col items-center gap-3 text-center sm:flex-row sm:gap-4 sm:text-left xl:gap-6"
			data-testid="judge-card"
		>
			<div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-medium-grey text-awesomer-purple text-xl lg:size-24 lg:text-2xl xl:size-28 xl:text-3xl">
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
			<div className="flex min-w-0 flex-col gap-0.5">
				<span className="font-semibold text-awesomer-purple text-base lg:text-lg xl:text-xl">
					{name}
				</span>
				<span className="text-dark-grey text-sm lg:text-base xl:text-lg">
					{company}
				</span>
			</div>
		</div>
	);
}

export default async function Judges() {
	const judges = await getJudges();

	return (
		<section
			aria-labelledby="judges-heading"
			className="w-full bg-white px-6 py-14 sm:px-12 md:py-20 lg:px-20 lg:py-28"
		>
			{/* Positioned so the content sits above the decorative squiggles */}
			<div className="relative mx-auto max-w-7xl">
				<div className="mb-10 md:mb-12">
					<h2
						className="font-bold text-3xl text-dark-grey sm:text-4xl lg:text-5xl"
						id="judges-heading"
					>
						Judges
					</h2>
					<Image
						alt=""
						aria-hidden="true"
						className="h-auto w-auto"
						height={17}
						src="/svgs/landingPage/green_underline.svg"
						width={130}
					/>
				</div>

				{judges.length ? (
					<div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-8 sm:gap-y-10 xl:grid-cols-3 xl:gap-x-12">
						{judges.map((judge) => (
							<JudgeItem judge={judge} key={judge.sys.id} />
						))}
					</div>
				) : (
					<p className="text-dark-grey">
						Judge information will be announced soon.
					</p>
				)}
			</div>
		</section>
	);
}
