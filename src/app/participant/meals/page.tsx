import type { Metadata } from "next";
import { MealsView } from "@/app/components/participant/meals/MealsView";
import { hasHackathonDayStarted } from "@/lib/participant-events";
import { requireRole } from "@/server/better-auth/auth-helpers/helpers";
import { api } from "@/trpc/server";
import { Role } from "@/types/types";

export const metadata: Metadata = {
	title: "Meals | Hack the Change"
};

export default async function MealsPage() {
	const { user } = await requireRole([Role.PARTICIPANT, Role.ADMIN]);
	const [nextMeal, meals, settings] = await Promise.all([
		api.meals.getNextMeal(),
		api.meals.getActiveMeals(),
		api.hackathonSettings.get()
	]);
	const isParticipant = user.role === Role.PARTICIPANT;
	const mealPreference = isParticipant ? (user.wantsFood ?? null) : true;
	// Only checked-in participants who explicitly opted in get meal tickets.
	const ticket =
		nextMeal && isParticipant && user.checkedIn && mealPreference === true
			? await api.events.rotateParticipantEventTicket({ eventId: nextMeal.id })
			: null;

	return (
		<MealsView
			dietaryRestrictions={user.dietaryRestrictions}
			displayName={user.name?.trim() || "Participant"}
			mealPreference={mealPreference}
			meals={meals}
			needsCheckIn={
				isParticipant &&
				!user.checkedIn &&
				hasHackathonDayStarted(settings?.startDate)
			}
			nextMeal={nextMeal}
			ticket={ticket}
		/>
	);
}
