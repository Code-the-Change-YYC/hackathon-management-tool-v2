"use client";

import Image from "next/image";
import type { RouterOutputs } from "@/trpc/react";
import { EventTicketStatus } from "@/types/types";
import { StyledQRCode } from "./StyledQRCode";
import { TicketTeeth } from "./TicketTeeth";

const timeFormatter = new Intl.DateTimeFormat("en-US", {
	hour: "numeric",
	minute: "2-digit"
});

type EventTicket = RouterOutputs["events"]["rotateParticipantEventTicket"];
type TicketEvent = EventTicket["event"];

function getMealTicketStatus(
	event: Pick<TicketEvent, "startTime" | "endTime">,
	now: Date
) {
	const startTime = new Date(event.startTime).getTime();
	const endTime = new Date(event.endTime).getTime();
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
	displayName: string;
	ticket: EventTicket | null;
};

function getTicketDescription(ticket: EventTicket | null, now: Date) {
	if (!ticket) {
		return "There is no upcoming meal ticket available.";
	}

	if (ticket.status === EventTicketStatus.ALREADY_CHECKED_IN) {
		return `You checked in at ${timeFormatter.format(new Date(ticket.checkedInAt))}.`;
	}

	return `${ticket.event.title} is ${getMealTicketStatus(
		{
			startTime: ticket.event.startTime,
			endTime: ticket.event.endTime
		},
		now
	)} until ${timeFormatter.format(new Date(ticket.event.endTime))}.`;
}

export function MealTicket({ displayName, ticket }: MealTicketProps) {
	const ticketMealName = ticket?.event.title ?? "Meal";
	const ticketDescription = getTicketDescription(ticket, new Date());

	return (
		<section className="flex flex-col gap-4">
			<h2 className="font-medium text-dark-grey text-lg">Your Meal Ticket</h2>

			<div className="relative flex flex-col overflow-hidden bg-pastel-pink md:h-62.25 md:flex-row">
				<TicketTeeth position="top" />
				<TicketTeeth position="bottom" />
				<TicketTeeth position="left" />
				<TicketTeeth position="right" />

				<div className="order-2 flex h-98.5 min-w-0 flex-1 flex-col sm:flex-row md:order-1 md:h-full">
					<div className="flex min-w-0 flex-col justify-start gap-2 px-6 pt-8 pb-2 md:flex-1 md:justify-center md:px-10 md:py-6">
						<p className="font-semibold text-dark-pink text-xs uppercase">
							{ticketMealName} Ticket For
						</p>
						<p className="wrap-break-word font-medium text-dark-grey text-xl">
							{displayName}
						</p>
						<p className="max-w-sm text-dark-grey/70 text-sm leading-6">
							{ticket?.status === EventTicketStatus.ACTIVE
								? "Present this QR code to a Code the Change member scanning tickets at the door to receive your meal. "
								: null}
							{ticketDescription}
						</p>
					</div>

					<div className="flex min-h-0 min-w-0 flex-1 items-start justify-center overflow-hidden md:items-center md:justify-start">
						<div className="-translate-x-4 md:-translate-x-6 flex w-fit items-center">
							<Image
								alt="Pizza slice"
								className="h-63.5 w-63.5 shrink-0 object-contain md:h-60 md:w-63.25"
								height={232}
								src="/svgs/pizza.svg"
								width={292}
							/>
							<Image
								alt="Cola can"
								className="-ml-20 sm:-ml-24 md:-ml-24 h-53.25 w-53.25 shrink-0 object-contain md:h-60 md:w-61.25"
								height={249}
								src="/svgs/cola.svg"
								width={254}
							/>
						</div>
					</div>
				</div>

				<div className="relative order-1 flex h-90.25 w-full shrink-0 items-center justify-center border-white/80 border-b-4 border-dashed bg-pastel-pink/60 px-8 py-11 md:order-2 md:h-full md:w-62.25 md:border-b-0 md:border-l-4 md:p-9">
					<div className="-translate-x-1/2 absolute bottom-0 left-0 size-6 translate-y-1/2 rounded-full bg-background md:hidden" />
					<div className="absolute right-0 bottom-0 size-6 translate-x-1/2 translate-y-1/2 rounded-full bg-background md:hidden" />
					<div className="-left-0.5 -translate-x-1/2 -translate-y-1/2 absolute top-0 hidden size-6 rounded-full bg-background md:block" />
					<div className="-left-0.5 -translate-x-1/2 absolute bottom-0 hidden size-6 translate-y-1/2 rounded-full bg-background md:block" />
					{ticket?.status === EventTicketStatus.ACTIVE ? (
						<div className="aspect-square h-full max-h-full max-w-full">
							<StyledQRCode value={ticket.token} />
						</div>
					) : (
						<p className="max-w-44 text-center font-medium text-dark-grey text-sm">
							{ticket?.status === EventTicketStatus.ALREADY_CHECKED_IN
								? "Already checked in"
								: "No ticket available"}
						</p>
					)}
				</div>
			</div>
		</section>
	);
}
