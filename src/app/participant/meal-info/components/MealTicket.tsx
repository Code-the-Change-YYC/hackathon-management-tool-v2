"use client";

import Image from "next/image";
import QRCode from "react-qr-code";
import { api, type RouterOutputs } from "@/trpc/react";
import { TicketTeeth } from "./TicketTeeth";

const timeFormatter = new Intl.DateTimeFormat("en-US", {
	hour: "numeric",
	minute: "2-digit"
});

type MealTicketMeal = NonNullable<RouterOutputs["meals"]["getNextMeal"]>;

function getMealTicketStatus(
	meal: Pick<MealTicketMeal, "startTime" | "endTime">,
	now: Date
) {
	const startTime = new Date(meal.startTime).getTime();
	const endTime = new Date(meal.endTime).getTime();
	const currentTime = now.getTime();

	if (currentTime >= startTime && currentTime <= endTime) {
		return "ongoing";
	}

	if (currentTime > endTime) {
		return "completed";
	}

	const minutesUntilStart = Math.max(
		1,
		Math.round((startTime - currentTime) / 60000)
	);

	if (minutesUntilStart <= 60) {
		return `in ${minutesUntilStart} min`;
	}

	return "scheduled";
}

type MealTicketProps = {
	userId: string;
	displayName: string;
	emailAddress: string;
};

export function MealTicket({
	userId,
	displayName,
	emailAddress
}: MealTicketProps) {
	const { data: ticketMeal, isLoading } = api.meals.getNextMeal.useQuery();
	const now = new Date();
	const ticketMealName = ticketMeal?.title ?? "Meal";
	const ticketDescription = ticketMeal
		? `${ticketMealName} is ${getMealTicketStatus(
				{
					startTime: ticketMeal.startTime,
					endTime: ticketMeal.endTime
				},
				now
			)} until ${timeFormatter.format(new Date(ticketMeal.endTime))}.`
		: isLoading
			? "Checking the next meal window."
			: "Show this QR code to a Code the Change member to receive your meal.";

	return (
		<section className="space-y-4">
			<h2 className="font-semibold text-dark-grey text-lg">Your Meal Ticket</h2>

			<div className="relative flex flex-col overflow-hidden bg-pastel-pink md:h-62.25 md:flex-row">
				<TicketTeeth position="top" />
				<TicketTeeth position="bottom" />
				<TicketTeeth position="left" />
				<TicketTeeth position="right" />

				<div className="order-2 flex h-98.5 min-w-0 flex-1 flex-col sm:flex-row md:order-1 md:h-full">
					<div className="flex min-w-0 flex-col justify-start gap-2 px-6 pt-8 pb-2 md:flex-1 md:justify-center md:px-10 md:py-6">
						<p className="font-extrabold text-dark-pink text-xs uppercase">
							{ticketMealName} Ticket For
						</p>
						<p className="wrap-break-word font-bold text-dark-grey text-xl">
							{displayName}
						</p>
						<p className="max-w-sm text-dark-grey/70 text-sm leading-6">
							Present this QR code to a member of Code the Change scanning
							tickets at the door to receive your meal. {ticketDescription}
						</p>
					</div>

					<div className="flex min-h-0 min-w-0 flex-1 items-start justify-center overflow-hidden md:items-center md:justify-start">
						<div className="-translate-x-4 md:-translate-x-10 flex w-fit items-center">
							<Image
								alt="Pizza slice"
								className="h-63.5 w-63.5 shrink-0 object-contain md:h-73 md:w-73"
								height={232}
								src="/svgs/pizza.svg"
								width={292}
							/>
							<Image
								alt="Cola can"
								className="-ml-20 sm:-ml-24 md:-ml-28 h-53.25 w-53.25 shrink-0 object-contain md:h-67.5 md:w-67.5"
								height={249}
								src="/svgs/cola.svg"
								width={254}
							/>
						</div>
					</div>
				</div>

				<div className="relative order-1 flex h-90.25 w-full shrink-0 items-center justify-center border-white/80 border-b-4 border-dashed bg-pastel-pink/60 px-8 py-11 md:order-2 md:h-full md:w-62.25 md:border-b-0 md:border-l-4 md:p-9">
					<div className="-translate-x-1/2 absolute bottom-0 left-0 h-6 w-6 translate-y-1/2 rounded-full bg-pale-grey md:hidden" />
					<div className="absolute right-0 bottom-0 h-6 w-6 translate-x-1/2 translate-y-1/2 rounded-full bg-pale-grey md:hidden" />
					<div className="-left-0.5 -translate-x-1/2 -translate-y-1/2 absolute top-0 hidden h-6 w-6 rounded-full bg-pale-grey md:block" />
					<div className="-left-0.5 -translate-x-1/2 absolute bottom-0 hidden h-6 w-6 translate-y-1/2 rounded-full bg-pale-grey md:block" />
					<div className="aspect-square h-full max-h-full max-w-full">
						<QRCode
							className="h-full w-full [&>path:first-of-type]:fill-pastel-pink [&>path:last-of-type]:fill-awesomer-purple"
							value={`${userId}::${displayName}::${emailAddress}`}
						/>
					</div>
				</div>
			</div>
		</section>
	);
}
