"use client";
import { FieldLegend, FieldSet } from "@/app/components/ui/field";
import { getRubricBands } from "@/lib/judging";
import { cn } from "@/lib/utils";
import {
	type Criterion,
	getBandDescription,
	getCriterionDescription,
	getScoreFillClass,
	getScoreTextColor,
	getScoreTone
} from "./useJudgePortalData";

function ScoreButtonGroup({
	criterion,
	includeZero,
	onChange,
	value
}: {
	criterion: Criterion;
	includeZero: boolean;
	onChange: (value: number) => void;
	value?: number;
}) {
	return (
		<FieldSet>
			<FieldLegend variant="label">Score for {criterion.name}</FieldLegend>
			<div className="flex flex-wrap gap-3">
				{Array.from(
					{ length: criterion.maxScore + (includeZero ? 1 : 0) },
					(_, index) => index + (includeZero ? 0 : 1)
				).map((option) => (
					<label className="relative cursor-pointer" key={option}>
						<input
							aria-label={`${option} out of ${criterion.maxScore}`}
							checked={value === option}
							className="peer sr-only"
							name={`score-${criterion.id}`}
							onChange={() => onChange(option)}
							type="radio"
							value={option}
						/>
						<span
							className={cn(
								"flex h-14 w-15.5 items-center justify-center rounded-lg border font-medium text-base transition peer-focus-visible:outline-2 peer-focus-visible:outline-ring peer-focus-visible:outline-offset-2",
								value === option
									? getScoreFillClass(option, criterion.maxScore)
									: "border-input bg-background text-foreground"
							)}
						>
							{option}
						</span>
					</label>
				))}
			</div>
		</FieldSet>
	);
}

function RubricBandCard({
	band,
	criterion,
	selected
}: {
	band: ReturnType<typeof getRubricBands>[number];
	criterion: Criterion;
	selected: boolean;
}) {
	const toneValue = band.max;
	return (
		<article
			className={`rounded-lg border p-3 ${
				selected
					? getScoreTone(toneValue, criterion.maxScore)
					: "border-grey-200 bg-white"
			}`}
		>
			<div className="mb-2 flex items-center gap-2">
				<p
					className={`m-0 text-2xl leading-8 ${getScoreTextColor(
						toneValue,
						criterion.maxScore
					)}`}
				>
					{band.range}
				</p>
				<p className="m-0 font-medium text-grey-800 text-xs uppercase leading-4">
					{band.label}
				</p>
			</div>
			<p className="m-0 text-[13px] text-grey-800 leading-4.5">
				{getBandDescription(criterion, band.label)}
			</p>
		</article>
	);
}

function RubricBandGrid({
	criterion,
	includeZero,
	selectedScore
}: {
	criterion: Criterion;
	includeZero: boolean;
	selectedScore?: number;
}) {
	return (
		<div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-1">
			{getRubricBands(criterion.maxScore, includeZero).map((band) => (
				<RubricBandCard
					band={band}
					criterion={criterion}
					key={`${criterion.id}-${band.range}`}
					selected={
						selectedScore !== undefined &&
						selectedScore >= band.min &&
						selectedScore <= band.max
					}
				/>
			))}
		</div>
	);
}

export function JudgeMainCriterion({
	criterion,
	onScoreChange,
	score
}: {
	criterion: Criterion;
	onScoreChange: (criterionId: string, score: number) => void;
	score?: number;
}) {
	return (
		<div className="grid w-full gap-6 xl:grid-cols-[minmax(0,728px)_263px]">
			<section className="flex min-w-0 flex-col gap-8 xl:pr-4">
				<div className="flex flex-col gap-6">
					<h2 className="m-0 font-semibold text-[#1a1a1a] text-[28px] leading-9">
						{criterion.name}
					</h2>
					<p className="m-0 text-base text-grey-800 leading-6">
						{getCriterionDescription(criterion)}
					</p>
				</div>

				<div className="flex flex-col gap-3">
					<ScoreButtonGroup
						criterion={criterion}
						includeZero={false}
						onChange={(value) => onScoreChange(criterion.id, value)}
						value={score}
					/>
				</div>

				<div className="xl:hidden">
					<RubricBandGrid
						criterion={criterion}
						includeZero={false}
						selectedScore={score}
					/>
				</div>
			</section>

			<aside className="hidden border-[#eceae5] border-l pl-4 xl:block">
				<RubricBandGrid
					criterion={criterion}
					includeZero={false}
					selectedScore={score}
				/>
			</aside>
		</div>
	);
}

export function JudgeSidepotCriterion({
	criterion,
	onScoreChange,
	score
}: {
	criterion: Criterion;
	onScoreChange: (criterionId: string, score: number) => void;
	score?: number;
}) {
	return (
		<article className="overflow-hidden rounded-xl border border-grey-300 bg-white">
			<header className="flex items-center justify-between border-grey-100 border-b bg-grey-50 px-5 py-4">
				<div className="flex items-center gap-2.5">
					<span className="size-2.5 rounded-full bg-[#ec1245]" />
					<div>
						<h3 className="m-0 font-medium text-[#1a1a1a] text-base leading-6">
							{criterion.name}
						</h3>
						<p className="m-0 text-grey-400 text-xs leading-4">Sidepot</p>
					</div>
				</div>
				<div className="text-right font-medium">
					{score === undefined ? (
						<p className="m-0 text-[11px] text-auth-placeholder leading-3.5">
							Not yet scored
						</p>
					) : (
						<>
							<p className="m-0 text-[0px] text-black leading-none">
								<span className="text-[22px] leading-7">{score}</span>
								<span className="text-grey-400 text-sm leading-5">
									/{criterion.maxScore}
								</span>
							</p>
							<p className="m-0 text-[#434343] text-[9px] leading-3.5">
								Scored
							</p>
						</>
					)}
				</div>
			</header>
			<div className="border-grey-100 border-b px-5 py-3">
				<p className="m-0 text-grey-800 text-xs leading-4 sm:text-sm sm:leading-5">
					{getCriterionDescription(criterion)}
				</p>
			</div>
			<div className="flex flex-col gap-4 p-4">
				<ScoreButtonGroup
					criterion={criterion}
					includeZero
					onChange={(value) => onScoreChange(criterion.id, value)}
					value={score}
				/>
				<RubricBandGrid
					criterion={criterion}
					includeZero
					selectedScore={score}
				/>
			</div>
		</article>
	);
}
