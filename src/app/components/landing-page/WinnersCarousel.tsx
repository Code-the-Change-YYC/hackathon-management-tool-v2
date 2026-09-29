"use client";

import { LeftLine, RightLine } from "@mingcute/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getAssetUrl, getFields, getString } from "@/lib/contentful";
import useWindowDimensions from "@/lib/useWindowDimensions";
import { cn } from "@/lib/utils";
import type { PastHackathonWinner } from "@/types/contentfulTypes";

const VISIBLE_COUNT = {
	small: 1,
	medium: 3,
	large: 5
} as const;

const AWARD_COLORS = [
	"bg-strawberry-red",
	"bg-awesome-purple",
	"bg-dark-pink",
	"bg-dark-green",
	"bg-medium-pink"
] as const;

const ARROW_BUTTON_STYLES =
	"flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-full bg-white/80 text-awesomer-purple shadow-md transition hover:scale-110 hover:bg-white";

const getVisibleCount = (width: number) => {
	if (width >= 1280) return VISIBLE_COUNT.large;

	if (width >= 768) return VISIBLE_COUNT.medium;

	return VISIBLE_COUNT.small;
};

type WinnerCardProps = {
	winner: PastHackathonWinner;
	index: number;
	total: number;
};

function WinnerCard({ winner, index, total }: WinnerCardProps) {
	const scaleValue = (100 - 10 * Math.abs(index - Math.floor(total / 2))) / 100;
	const fields = getFields(winner);
	const projectName = getString(fields.projectName) ?? "";
	const awardName = getString(fields.awardName)?.trim();
	const image = getAssetUrl(fields.projectImage);
	const link = getString(fields.link)?.trim();
	const awardColor =
		AWARD_COLORS[index % AWARD_COLORS.length] ?? "bg-strawberry-red";
	const projectDescription = getString(fields.projectDescription)?.trim() ?? "";

	const cardContent = (
		<div className="@container absolute inset-0 flex flex-col justify-end rounded-[30px] bg-linear-to-b from-black/40 via-black/0 to-black/80 py-6">
			<div
				className={`${awardColor} mb-2.5 w-fit max-w-[90%] rounded-tr-20 rounded-br-20 py-1.5 pr-4 pl-2.5 shadow-[0px_4px_4.8px_0px_rgba(0,0,0,0.25)]`}
			>
				<span className="font-bold @3xs:text-xl @[12rem]:text-base text-sm text-white">
					{awardName || "Winner"}
				</span>
			</div>

			<div className="flex flex-col gap-1 px-2.5">
				<h3 className="wrap-break-word line-clamp-2 font-semibold @3xs:text-3xl @[12rem]:text-2xl text-white text-xl leading-tight [text-shadow:0px_4px_4px_rgb(0_0_0/0.25)]">
					{projectName}
				</h3>
				<p className="line-clamp-2 @[12rem]:text-sm text-white text-xs">
					{projectDescription}
				</p>
			</div>
		</div>
	);

	return (
		<li
			className="hover:-translate-y-4 relative flex aspect-1/2 min-w-40 max-w-72 flex-1 rounded-[30px] bg-center bg-cover bg-no-repeat shadow-[0px_4px_81px_0px_rgba(0,0,0,0.25)] transition-transform duration-300 hover:outline-4 hover:outline-awesomer-purple"
			style={{
				...(image ? { backgroundImage: `url(${image})` } : {}),
				transform: `scale(${scaleValue})`
			}}
		>
			{link ? (
				<Link
					className="absolute inset-0"
					href={link}
					rel="noopener noreferrer"
					target="_blank"
				>
					{cardContent}
				</Link>
			) : (
				<div className="absolute inset-0">{cardContent}</div>
			)}
		</li>
	);
}

export default function WinnersCarousel({
	winners
}: {
	winners: PastHackathonWinner[];
}) {
	const [startIndex, setStartIndex] = useState(0);
	const { width } = useWindowDimensions();
	const [visibleCount, setVisibleCount] = useState<number>(VISIBLE_COUNT.small);

	useEffect(() => setVisibleCount(getVisibleCount(width)), [width]);

	const shownCount = Math.min(visibleCount, winners.length);
	const visibleWinners = [...winners, ...winners].slice(
		startIndex,
		startIndex + shownCount
	);

	const prev = () =>
		setStartIndex((i) => (i === 0 ? winners.length - 1 : i - 1));

	const next = () => setStartIndex((i) => (i + 1) % winners.length);
	return (
		<>
			<div className="flex w-full items-center gap-2 sm:gap-4">
				<button
					aria-label="Previous winner"
					className={ARROW_BUTTON_STYLES}
					onClick={prev}
					type="button"
				>
					<LeftLine aria-hidden="true" size={24} />
				</button>

				<ul className="flex min-w-0 flex-1 items-center justify-center gap-2.5">
					{visibleWinners.map((winner, index) => (
						<WinnerCard
							index={index}
							key={`${winner.sys.id}-${index}`}
							total={shownCount}
							winner={winner}
						/>
					))}
				</ul>

				<button
					aria-label="Next winner"
					className={ARROW_BUTTON_STYLES}
					onClick={next}
					type="button"
				>
					<RightLine aria-hidden="true" size={24} />
				</button>
			</div>

			{winners.length > shownCount && (
				<div className="mt-8 flex justify-center gap-3">
					{winners.map((winner, index) => (
						<button
							aria-current={index === startIndex}
							aria-label={`Show winner ${index + 1} of ${winners.length}`}
							className={cn(
								"size-2.5 cursor-pointer rounded-full transition",
								index === startIndex
									? "scale-125 bg-awesomer-purple"
									: "bg-white/70 hover:bg-white"
							)}
							key={winner.sys.id}
							onClick={() => setStartIndex(index)}
							type="button"
						/>
					))}
				</div>
			)}
		</>
	);
}
