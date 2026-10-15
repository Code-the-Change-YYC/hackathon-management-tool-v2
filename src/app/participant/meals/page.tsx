import type { Metadata } from "next";
import { MealsView } from "@/app/components/participant/meals/MealsView";
import { requireRole } from "@/server/better-auth/auth-helpers/helpers";
import { api } from "@/trpc/server";
import { Role } from "@/types/types";

export const metadata: Metadata = {
	title: "Meals | Hack the Change"
};

export default async function MealsPage() {
	const { user } = await requireRole([Role.PARTICIPANT, Role.ADMIN]);
	const [nextMeal, meals] = await Promise.all([
		api.meals.getNextMeal(),
		api.meals.getActiveMeals()
	]);
	// Admins don't have meal tickets, but can still view this page.
	const ticket =
		nextMeal && user.role === Role.PARTICIPANT
			? await api.events.rotateParticipantEventTicket({ eventId: nextMeal.id })
			: null;

	return (
		<MealsView
			dietaryRestrictions={user.dietaryRestrictions}
			displayName={user.name?.trim() || "Participant"}
			meals={meals}
			ticket={ticket}
		/>
	);
}
