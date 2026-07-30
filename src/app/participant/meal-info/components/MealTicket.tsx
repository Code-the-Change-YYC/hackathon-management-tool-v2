"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "react-qr-code";

const mobileTicketCircleSize = 20;
const mobileTicketCircleGap = 6;
const sideTicketCircleCount = 9;
const sideTicketCutoutIds = Array.from(
	{ length: sideTicketCircleCount },
	(_, cutoutNumber) => `cutout-${cutoutNumber + 1}`
);

type TicketEdgeProps = {
	position: "top" | "bottom" | "left" | "right";
};

/*
This function renders the ticket cutouts for both the mobile
top/bottom edges and the desktop left/right edges.
*/
function TicketEdge({ position }: TicketEdgeProps) {
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
			const nextCount = Math.max(
				2,
				Math.floor(
					(width + mobileTicketCircleGap) /
						(mobileTicketCircleSize + mobileTicketCircleGap)
				)
			);
			setCircleCount(nextCount);
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
		const horizontalCutoutIds = Array.from(
			{ length: circleCount },
			(_, cutoutNumber) => `${position}-${cutoutNumber + 1}`
		);

		return (
			<div
				aria-hidden="true"
				className={`pointer-events-none absolute inset-x-2 ${verticalPositionClass} z-10 flex h-5 items-center justify-between md:hidden`}
				ref={edgeRef}
			>
				{horizontalCutoutIds.map((cutoutId) => (
					<div
						className="h-5 w-5 shrink-0 rounded-full bg-light-grey"
						key={cutoutId}
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
			{sideTicketCutoutIds.map((cutoutId) => (
				<div
					className="h-5 w-5 rounded-full bg-light-grey"
					key={`${position}-${cutoutId}`}
				/>
			))}
		</div>
	);
}

type MealTicketProps = {
	userId: string;
	displayName: string;
	emailAddress: string;
	ticketMealName: string;
	ticketCopy: string;
};

export function MealTicket({
	userId,
	displayName,
	emailAddress,
	ticketMealName,
	ticketCopy
}: MealTicketProps) {
	return (
		<section className="space-y-4">
			<h2 className="font-semibold text-dark-grey text-lg">Your Meal Ticket</h2>

			<div className="relative grid overflow-hidden bg-pastel-pink shadow-[0_14px_34px_rgba(255,133,156,0.18)] md:grid-cols-[minmax(0,1fr)_280px]">
				<TicketEdge position="top" />
				<TicketEdge position="bottom" />
				<TicketEdge position="left" />
				<TicketEdge position="right" />

				<div className="relative flex min-h-56 flex-col justify-center gap-2 px-6 py-8 sm:px-10">
					<div
						aria-hidden="true"
						className="absolute inset-y-0 right-0 hidden w-4 border-white/80 border-r-4 border-dashed md:block"
					/>
					<p className="font-extrabold text-dark-pink text-xs uppercase">
						{ticketMealName} Ticket For
					</p>
					<p className="wrap-break-word font-bold text-dark-grey text-xl">
						{displayName}
					</p>
					<p className="max-w-sm text-dark-grey/70 text-sm leading-6">
						Present this QR code to a member of Code the Change scanning tickets
						at the door to receive your meal. {ticketCopy}
					</p>
				</div>

				<div className="relative flex min-h-56 items-center justify-center border-white/80 border-t-4 border-dashed bg-pastel-pink/60 px-6 py-8 md:border-t-0">
					<div className="-translate-x-1/2 -translate-y-1/2 absolute top-0 left-0 h-6 w-6 rounded-full bg-light-grey md:hidden" />
					<div className="-translate-y-1/2 absolute top-0 right-0 h-6 w-6 translate-x-1/2 rounded-full bg-light-grey md:hidden" />
					<div className="-left-0.5 -translate-x-1/2 -translate-y-1/2 absolute top-0 hidden h-6 w-6 rounded-full bg-light-grey md:block" />
					<div className="-left-0.5 -translate-x-1/2 absolute bottom-0 hidden h-6 w-6 translate-y-1/2 rounded-full bg-light-grey md:block" />
					<div className="rounded-lg bg-pale-grey p-4 text-awesomer-purple">
						<QRCode
							className="h-44 w-44 [&>path:first-of-type]:fill-pale-grey [&>path:last-of-type]:fill-awesomer-purple"
							value={`${userId}::${displayName}::${emailAddress}`}
						/>
					</div>
				</div>
			</div>
		</section>
	);
}
