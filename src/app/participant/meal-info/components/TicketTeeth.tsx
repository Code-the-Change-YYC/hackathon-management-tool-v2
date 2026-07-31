"use client";

import { useEffect, useRef, useState } from "react";

const mobileTicketCircleSize = 20;
const mobileTicketCircleGap = 6;
const sideTicketCircleCount = 9;
const sideTicketTeethIds = Array.from(
	{ length: sideTicketCircleCount },
	(_, toothNumber) => `tooth-${toothNumber + 1}`
);

type TicketTeethProps = {
	position: "top" | "bottom" | "left" | "right";
};

export function TicketTeeth({ position }: TicketTeethProps) {
	const edgeRef = useRef<HTMLDivElement | null>(null);
	const [circleCount, setCircleCount] = useState(2);
	const isHorizontal = position === "top" || position === "bottom";

	useEffect(() => {
		if (!isHorizontal) {
			return;
		}

		const element = edgeRef.current;
		if (!element || typeof ResizeObserver === "undefined") {
			return;
		}

		const updateCircleCount = (width: number) => {
			setCircleCount(
				Math.max(
					2,
					Math.floor(
						(width + mobileTicketCircleGap) /
							(mobileTicketCircleSize + mobileTicketCircleGap)
					)
				)
			);
		};

		updateCircleCount(element.getBoundingClientRect().width);

		const observer = new ResizeObserver((entries) => {
			const entry = entries[0];
			if (!entry) {
				return;
			}

			updateCircleCount(entry.contentRect.width);
		});

		observer.observe(element);

		return () => {
			observer.disconnect();
		};
	}, [isHorizontal]);

	if (isHorizontal) {
		const verticalPositionClass =
			position === "top"
				? "top-0 -translate-y-1/2"
				: "bottom-0 translate-y-1/2";
		const horizontalTicketTeethIds = Array.from(
			{ length: circleCount },
			(_, toothNumber) => `${position}-tooth-${toothNumber + 1}`
		);

		return (
			<div
				aria-hidden="true"
				className={`pointer-events-none absolute inset-x-2 ${verticalPositionClass} z-10 flex h-5 items-center justify-between md:hidden`}
				ref={edgeRef}
			>
				{horizontalTicketTeethIds.map((toothId) => (
					<div
						className="h-5 w-5 shrink-0 rounded-full bg-pale-grey"
						key={toothId}
					/>
				))}
			</div>
		);
	}

	const sidePositionClass =
		position === "left"
			? "-translate-x-1/2 inset-y-2 left-0 md:flex"
			: "inset-y-2 right-0 translate-x-1/2 md:flex";

	return (
		<div
			aria-hidden="true"
			className={`pointer-events-none absolute z-10 hidden flex-col justify-between ${sidePositionClass}`}
		>
			{sideTicketTeethIds.map((toothId) => (
				<div
					className="h-5 w-5 rounded-full bg-pale-grey"
					key={`${position}-${toothId}`}
				/>
			))}
		</div>
	);
}
