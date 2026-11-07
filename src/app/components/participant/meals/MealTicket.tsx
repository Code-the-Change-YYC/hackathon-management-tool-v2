"use client";

import {
	CheckCircleFill,
	ForbidCircleFill,
	QuestionFill,
	TicketFill,
	TimeFill,
	TimeLine
} from "@mingcute/react";
import { differenceInMinutes, isAfter, isBefore } from "date-fns";
import { useCurrentTime } from "@/hooks/use-current-time";
import { formatTime } from "@/lib/datetime";
import type { RouterOutputs } from "@/trpc/react";
import { EventTicketStatus } from "@/types/types";
import { EmptyTicketQRCode } from "./EmptyTicketQRCode";
import { MealIllustrations } from "./MealIllustrations";
import { StyledQRCode } from "./StyledQRCode";

type EventTicket = RouterOutputs["events"]["issueParticipantEventTicket"];
type Meal = RouterOutputs["meals"]["getNextMeal"];

type TicketState =
	| { kind: "active"; token: string }
	| { kind: "checkedIn"; checkedInAt: Date }
	| { kind: "ended" | "optedOut" | "notSetUp" | "noMeals" | "admin" };

type EmptyTicketKind = Exclude<TicketState["kind"], "active">;

const EMPTY_TICKETS = {
	checkedIn: { icon: CheckCircleFill, label: "Checked in" },
	ended: { icon: TimeFill, label: "Meal ended" },
	optedOut: { icon: ForbidCircleFill, label: "Opted out" },
	notSetUp: { icon: QuestionFill, label: "Not set up" },
	noMeals: { icon: TicketFill, label: "No meals" },
	admin: { icon: TicketFill, label: "Preview" }
} satisfies Record<EmptyTicketKind, Parameters<typeof EmptyTicketQRCode>[0]>;

function getTicketState(
	ticket: EventTicket | null,
	mealPreference: boolean | null,
	isAdmin: boolean,
	now: Date
): TicketState {
	if (isAdmin) return { kind: "admin" };
	if (mealPreference === false) return { kind: "optedOut" };
	if (mealPreference === null) return { kind: "notSetUp" };
	if (!ticket) return { kind: "noMeals" };
	if (ticket.status === EventTicketStatus.ALREADY_CHECKED_IN) {
		return { kind: "checkedIn", checkedInAt: ticket.checkedInAt };
	}
	// Tickets are only issued for meals that haven't ended, but the page can
	// stay open past the end time.
	if (isAfter(now, ticket.event.endTime)) return { kind: "ended" };
	return { kind: "active", token: ticket.token };
}

function getDescription(state: TicketState) {
	switch (state.kind) {
		case "active":
			return "Show this QR code to a Code the Change member at the meal.";
		case "checkedIn":
			return `You checked in at ${formatTime(state.checkedInAt)}. Enjoy your meal!`;
		case "ended":
			return "This meal has ended. Refresh to see your next ticket.";
		case "optedOut":
			return "You aren't opted in for meals. See an event staff member if you changed your mind.";
		case "notSetUp":
			return "Complete your meal preferences during onboarding to get a meal ticket.";
		case "noMeals":
			return "There are no more meals scheduled.";
		case "admin":
			return "Admins don't get meal tickets. Participants see their QR code here.";
	}
}

function getMealTiming(meal: { startTime: Date; endTime: Date }, now: Date) {
	const endTime = formatTime(meal.endTime);

	if (isAfter(now, meal.endTime)) return `Ended at ${endTime}`;
	if (!isBefore(now, meal.startTime)) return `Being served until ${endTime}`;

	const minutesUntilStart = Math.max(
		1,
		differenceInMinutes(meal.startTime, now, { roundingMethod: "round" })
	);
	if (minutesUntilStart <= 60) {
		return `Starts in ${minutesUntilStart} min · until ${endTime}`;
	}
	return `${formatTime(meal.startTime)} – ${endTime}`;
}

export function MealTicket({
	displayName,
	ticket,
	meal: nextMeal,
	mealPreference,
	isAdmin,
	teamCode
}: {
	displayName: string;
	ticket: EventTicket | null;
	meal: Meal;
	mealPreference: boolean | null;
	isAdmin: boolean;
	teamCode: string | null;
}) {
	const now = useCurrentTime();
	const meal = ticket?.event ?? nextMeal;
	const state = getTicketState(ticket, mealPreference, isAdmin, now);

	return (
		<section aria-label="Meal ticket" className="@container/meal-ticket">
			{/* The stub comes last so screen readers reach the name first, but
			    it sits on top in the stacked layout. */}
			<div className="ticket-teeth-y @min-[40rem]/meal-ticket:ticket-teeth-x flex @min-[40rem]/meal-ticket:h-62.25 @min-[40rem]/meal-ticket:flex-row flex-col-reverse">
				<div className="ticket-notch-top @min-[40rem]/meal-ticket:ticket-notch-right flex min-w-0 flex-1 @min-[40rem]/meal-ticket:flex-row flex-col @min-[40rem]/meal-ticket:items-center @min-[40rem]/meal-ticket:gap-6 gap-4 bg-pastel-pink px-4 @min-[40rem]/meal-ticket:pr-2 @min-[40rem]/meal-ticket:pb-0 pb-6 @min-[40rem]/meal-ticket:pl-10">
					<div className="flex @min-[40rem]/meal-ticket:min-w-48 min-w-0 flex-1 flex-col gap-2 @min-[40rem]/meal-ticket:px-0 px-2 @min-[40rem]/meal-ticket:py-6 pt-6">
						<p className="font-semibold text-dark-pink text-xs uppercase">
							{meal?.title ?? "Meal"} Ticket For
						</p>
						<p className="wrap-break-word font-medium text-dark-grey text-xl">
							{displayName}
						</p>
						{meal && (
							<p className="flex items-center gap-1.5 font-medium text-dark-grey text-sm">
								<TimeLine aria-hidden className="size-4 shrink-0" />
								{getMealTiming(meal, now)}
							</p>
						)}
						<p className="max-w-sm text-muted-foreground text-sm">
							{getDescription(state)}
						</p>
					</div>
					<MealIllustrations className="@min-[40rem]/meal-ticket:w-[min(25rem,55%)] w-full min-w-0 max-w-100 self-center" />
				</div>

				<div className="ticket-notch-bottom @min-[40rem]/meal-ticket:ticket-notch-left flex @min-[40rem]/meal-ticket:w-62.25 w-full min-w-0 shrink-0 flex-col items-center justify-center border-white/80 @min-[40rem]/meal-ticket:border-b-0 border-b-4 @min-[40rem]/meal-ticket:border-l-4 border-dashed bg-pastel-pink @min-[40rem]/meal-ticket:p-5 px-8 py-7">
					{state.kind === "active" && teamCode && (
						<p className="shrink-0 font-semibold text-awesomer-purple text-xs uppercase leading-none tracking-wide">
							{teamCode}
						</p>
					)}
					<div className="aspect-square w-full @min-[40rem]/meal-ticket:max-w-[calc(100%-0.75rem)] max-w-76">
						{state.kind === "active" ? (
							<StyledQRCode value={state.token} />
						) : (
							<EmptyTicketQRCode {...EMPTY_TICKETS[state.kind]} />
						)}
					</div>
				</div>
			</div>
		</section>
	);
}
