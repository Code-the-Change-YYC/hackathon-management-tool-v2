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
	// Admins don't have meal tickets, but can still view this page.
	const ticket =
		nextMeal && isParticipant && user.checkedIn
			? await api.events.rotateParticipantEventTicket({ eventId: nextMeal.id })
			: null;

	return (
		<MealsView
			dietaryRestrictions={user.dietaryRestrictions}
			displayName={user.name?.trim() || "Participant"}
			meals={meals}
			needsCheckIn={
				isParticipant &&
				!user.checkedIn &&
				hasHackathonDayStarted(settings?.startDate)
			}
			ticket={ticket}
		/>
	);
}
