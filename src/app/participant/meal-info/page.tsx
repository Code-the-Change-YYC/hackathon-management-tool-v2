import { requireRole } from "@/server/better-auth/auth-helpers/helpers";
import { api } from "@/trpc/server";
import { Role } from "@/types/types";
import { DietaryRestriction } from "./components/DietaryRestriction";
import { MealScheduleSection } from "./components/MealScheduleSection";
import { MealTicket } from "./components/MealTicket";

export default async function MealInfoPage() {
	const session = await requireRole([Role.PARTICIPANT, Role.ADMIN]);
	const displayName = session.user.name?.trim() || "Participant";
	const nextMeal = await api.meals.getNextMeal();
	const ticket = nextMeal
		? await api.events.rotateParticipantEventTicket({ eventId: nextMeal.id })
		: null;

	return (
		<main className="min-h-screen bg-background px-4 py-6 text-dark-grey md:px-8 lg:px-6">
			<div className="mx-auto flex w-full max-w-6xl flex-col gap-16">
				<div className="flex flex-col gap-6">
					<header className="space-y-1">
						<h1 className="font-semibold text-3xl text-dark-grey">
							Meal Information
						</h1>
						<p className="text-dark-grey/70 text-sm">
							Your meal tickets, dietary restrictions, and upcoming meal times
						</p>
					</header>

					<MealTicket displayName={displayName} ticket={ticket} />
				</div>

				<DietaryRestriction
					dietaryRestrictions={session.user.dietaryRestrictions}
				/>

				<MealScheduleSection />
			</div>
		</main>
	);
}
