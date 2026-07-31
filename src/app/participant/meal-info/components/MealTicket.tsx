"use client";

import Image from "next/image";
import QRCode from "react-qr-code";
import { api, type RouterOutputs } from "@/trpc/react";

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
				<div className="flex h-98.5 flex-1 flex-col sm:flex-row md:h-full">
					<div className="flex flex-1 flex-col justify-center gap-2 px-6 py-6 md:px-10">
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

					<div className="flex flex-1 items-center justify-center overflow-hidden">
						<div className="flex w-fit items-center justify-center">
							<Image
								alt="Pizza slice"
								className="h-63.5 w-63.5 shrink-0 object-contain md:h-73 md:w-73"
								height={232}
								src="/svgs/pizza.svg"
								width={292}
							/>
							<Image
								alt="Cola can"
								className="-ml-20 md:-ml-28 h-53.25 w-53.25 shrink-0 object-contain md:h-67.5 md:w-67.5"
								height={249}
								src="/svgs/cola.svg"
								width={254}
							/>
						</div>
					</div>
				</div>

				<div className="relative flex h-90.25 w-full shrink-0 items-center justify-center border-white/80 border-t-4 border-dashed bg-pastel-pink/60 px-8 py-11 md:h-full md:w-62.25 md:border-t-0 md:border-l-4 md:p-9">
					<div className="aspect-square h-full max-h-full max-w-full">
						<QRCode
							className="h-full w-full [&>path:first-of-type]:fill-pale-grey [&>path:last-of-type]:fill-awesomer-purple"
							value={`${userId}::${displayName}::${emailAddress}`}
						/>
					</div>
				</div>
			</div>
		</section>
	);
}
