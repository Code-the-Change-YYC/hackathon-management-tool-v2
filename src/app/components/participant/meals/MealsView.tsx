"use client";

import PageHeader from "@/app/components/PageHeader";
import { useCurrentTime } from "@/hooks/use-current-time";
import type { RouterOutputs } from "@/trpc/react";
import { CheckInBanner } from "../CheckInBanner";
import { DietaryRestriction } from "./DietaryRestriction";
import { MealScheduleSection } from "./MealScheduleSection";
import { MealTicket } from "./MealTicket";

type Ticket = RouterOutputs["events"]["issueParticipantEventTicket"];
type Meal = RouterOutputs["meals"]["getActiveMeals"][number];

export function MealsView({
	displayName,
	isAdmin,
	needsCheckIn,
	ticket,
	dietaryRestrictions,
	meals,
	nextMeal,
	mealPreference
}: {
	displayName: string;
	isAdmin: boolean;
	needsCheckIn: boolean;
	ticket: Ticket | null;
	dietaryRestrictions: string[];
	meals: Meal[];
	nextMeal: Meal | null;
	mealPreference: boolean | null;
}) {
	const now = useCurrentTime();

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
					<MealTicket
						displayName={displayName}
						isAdmin={isAdmin}
						meal={nextMeal}
						mealPreference={mealPreference}
						ticket={ticket}
					/>
				)}
				<DietaryRestriction dietaryRestrictions={dietaryRestrictions} />
				<MealScheduleSection meals={meals} now={now} />
			</div>
		</div>
	);
}
