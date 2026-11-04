"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import PageHeader from "@/app/components/PageHeader";
import { useCurrentTime } from "@/hooks/use-current-time";
import type { RouterOutputs } from "@/trpc/react";
import { CheckInBanner } from "../CheckInBanner";
import { DietaryRestriction } from "./DietaryRestriction";
import { MealScheduleSection } from "./MealScheduleSection";
import { MealTicket } from "./MealTicket";

type Ticket = RouterOutputs["events"]["rotateParticipantEventTicket"];
type Meal = RouterOutputs["meals"]["getActiveMeals"][number];

export function MealsView({
	displayName,
	needsCheckIn,
	ticket,
	dietaryRestrictions,
	meals
}: {
	displayName: string;
	needsCheckIn: boolean;
	ticket: Ticket | null;
	dietaryRestrictions: string[];
	meals: Meal[];
}) {
	const now = useCurrentTime();
	const router = useRouter();

	useEffect(() => {
		if (!ticket) return;
		const remaining = ticket.event.availableUntil.getTime() - Date.now();
		const timeout = window.setTimeout(
			() => router.refresh(),
			Math.min(Math.max(remaining + 1_000, 1_000), 2_147_483_647)
		);
		return () => window.clearTimeout(timeout);
	}, [ticket, router]);

	return (
		<div className="flex flex-col gap-6">
			<PageHeader
				description="Your meal tickets, dietary restrictions, and upcoming meal times."
				title="Meals"
			/>
			<div className="flex flex-col gap-6">
				{needsCheckIn ? (
					<CheckInBanner />
				) : (
					<MealTicket displayName={displayName} ticket={ticket} />
				)}
				<DietaryRestriction dietaryRestrictions={dietaryRestrictions} />
				<MealScheduleSection meals={meals} now={now} />
			</div>
		</div>
	);
}
