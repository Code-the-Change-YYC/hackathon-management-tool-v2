"use client";

import { useState } from "react";
import { winners } from "./data/winners";
import WinnerCard from "./WinnerCard";

const VISIBLE_COUNT = 5;

export default function Winners() {
	const [startIndex, setStartIndex] = useState(0);

	const visibleWinners = [...winners, ...winners].slice(
		startIndex,
		startIndex + VISIBLE_COUNT
	);

	const prev = () =>
		setStartIndex((i) => (i === 0 ? winners.length - 1 : i - 1));

	const next = () => setStartIndex((i) => (i + 1) % winners.length);

	return (
		<section className="w-full bg-pinky-peach px-40 py-32">
			<div className="relative mb-12 inline-flex items-center gap-2">
				<h2 className="pr-2 font-semibold text-3xl md:text-5xl">
					<span className="text-dark-grey not-italic">Last Year&apos;s </span>
					<span className="text-awesomer-purple italic">Winners</span>
				</h2>
			</div>

			<div className="flex items-center gap-4">
				<button
					className="shrink-0 text-2xl text-fuzzy-peach transition hover:scale-110"
					onClick={prev}
					type="button"
				>
					‹
				</button>

				<ul className="flex min-h-113.75 w-full items-center justify-center gap-2.5 overflow-hidden py-4">
					{visibleWinners.map((winner, index) => (
						<WinnerCard
							index={index}
							key={`${winner.id}-${startIndex}-${index}`}
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
					›
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
						key={winner.id}
						onClick={() => setStartIndex(index)}
						type="button"
					/>
				))}
			</div>
		</section>
	);
}
