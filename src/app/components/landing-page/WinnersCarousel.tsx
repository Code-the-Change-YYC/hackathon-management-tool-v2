"use client";

import { LeftLine, RightLine } from "@mingcute/react";
import { useEffect, useState } from "react";
import useWindowDimensions from "@/lib/useWindowDimensions";
import type { PastHackathonWinner } from "@/types/contentfulTypes";
import WinnerCard from "./WinnerCard";

const VISIBLE_COUNT = {
	small: 1,
	medium: 3,
	large: 5
} as const;

const getVisibleCount = (width: number) => {
	if (width >= 1024) return VISIBLE_COUNT.large;

	if (width >= 768) return VISIBLE_COUNT.medium;

	return VISIBLE_COUNT.small;
};

export default function WinnersCarousel({
	winners
}: {
	winners: PastHackathonWinner[];
}) {
	const [startIndex, setStartIndex] = useState(0);
	const { width } = useWindowDimensions();
	const [visibleCount, setVisibleCount] = useState<number>(VISIBLE_COUNT.small);

	useEffect(() => setVisibleCount(getVisibleCount(width)), [width]);

	const visibleWinners = [...winners, ...winners].slice(
		startIndex,
		startIndex + visibleCount
	);

	const prev = () =>
		setStartIndex((i) => (i === 0 ? winners.length - 1 : i - 1));

	const next = () => setStartIndex((i) => (i + 1) % winners.length);
	return (
		<>
			<div className="flex w-full items-center gap-4">
				<button
					className="shrink-0 text-2xl text-fuzzy-peach transition hover:scale-110"
					onClick={prev}
					type="button"
				>
					<LeftLine aria-hidden="true" size={24} />
				</button>

				<ul className="flex w-full items-center justify-center gap-2.5">
					{visibleWinners.map((winner, index) => (
						<WinnerCard
							index={index}
							key={`${winner.sys.id}-${index}`}
							total={visibleCount}
							winner={winner}
						/>
					))}
				</ul>

				<button
					className="shrink-0 text-2xl text-fuzzy-peach transition hover:scale-110"
					onClick={next}
					type="button"
				>
					<RightLine aria-hidden="true" size={24} />
				</button>
			</div>

			{winners.length !== VISIBLE_COUNT.large && (
				<div className="mt-6 flex justify-center gap-3">
					{winners.map((winner, index) => (
						<button
							className={`h-2 w-2 rounded-full transition ${
								index === startIndex % winners.length
									? "scale-110 bg-fuzzy-peach"
									: "bg-grey-purple/30"
							}`}
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
