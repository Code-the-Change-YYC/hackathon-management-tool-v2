"use client";

import { LeftLine, RightLine } from "@mingcute/react";
import { useState } from "react";
import type { PastHackathonWinner } from "@/types/contentfulTypes";
import WinnerCard from "./WinnerCard";

const VISIBLE_COUNT = 5;

export default function WinnersCarousel({
	winners
}: {
	winners: PastHackathonWinner[];
}) {
	const [startIndex, setStartIndex] = useState(0);
	const visibleWinners = [...winners, ...winners].slice(
		startIndex,
		startIndex + VISIBLE_COUNT
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
							total={VISIBLE_COUNT}
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
		</>
	);
}
