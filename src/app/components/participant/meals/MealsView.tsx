"use client";

import PageHeader from "@/app/components/PageHeader";
import { useCurrentTime } from "@/hooks/use-current-time";
import type { RouterOutputs } from "@/trpc/react";
import { DietaryRestriction } from "./DietaryRestriction";
import { MealScheduleSection } from "./MealScheduleSection";
import { MealTicket } from "./MealTicket";

type Ticket = RouterOutputs["events"]["rotateParticipantEventTicket"];
type Meal = RouterOutputs["meals"]["getActiveMeals"][number];

export function MealsView({
	displayName,
	ticket,
	dietaryRestrictions,
	meals
}: {
	displayName: string;
	ticket: Ticket | null;
	dietaryRestrictions: string[];
	meals: Meal[];
}) {
	const now = useCurrentTime();

	return (
		<div className="flex flex-col gap-6">
			<PageHeader
				description="Your meal tickets, dietary restrictions, and upcoming meal times."
				title="Meals"
			/>
			<div className="flex flex-col gap-6">
				<MealTicket displayName={displayName} ticket={ticket} />
				<DietaryRestriction dietaryRestrictions={dietaryRestrictions} />
				<MealScheduleSection meals={meals} now={now} />
			</div>
		</div>
	);
}
