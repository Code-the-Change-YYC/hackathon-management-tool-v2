import PageHeader from "@/app/components/PageHeader";
import { requireRole } from "@/server/better-auth/auth-helpers/helpers";
import { api } from "@/trpc/server";
import { Role } from "@/types/types";
import { DietaryRestriction } from "./components/DietaryRestriction";
import { MealScheduleSection } from "./components/MealScheduleSection";
import { MealTicket } from "./components/MealTicket";

export default async function MealsPage() {
	const session = await requireRole([Role.PARTICIPANT, Role.ADMIN]);
	const displayName = session.user.name?.trim() || "Participant";
	const nextMeal = await api.meals.getNextMeal();
	const ticket =
		nextMeal && session.user.role === Role.PARTICIPANT
			? await api.events.rotateParticipantEventTicket({ eventId: nextMeal.id })
			: null; // Admin users do not have meal tickets. They should still be able to view this page.

	return (
		<div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
			<PageHeader
				description="Your meal tickets, dietary restrictions, and upcoming meal times."
				title="Meals"
			/>
			<div className="flex flex-col gap-12">
				<MealTicket displayName={displayName} ticket={ticket} />
				<DietaryRestriction
					dietaryRestrictions={session.user.dietaryRestrictions}
				/>
				<MealScheduleSection />
			</div>
		</div>
	);
}
