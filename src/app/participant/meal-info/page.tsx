import { requireRole } from "@/server/better-auth/auth-helpers/helpers";
import { Role } from "@/types/types";
import { DietaryRestriction } from "./components/DietaryRestriction";
import { MealScheduleSection } from "./components/MealScheduleSection";
import { MealTicket } from "./components/MealTicket";

export default async function MealInfoPage() {
	const session = await requireRole([Role.PARTICIPANT, Role.ADMIN]);
	const displayName = session.user.name?.trim() || "Participant";
	const emailAddress = session.user.email;

	const dietaryRestrictions =
		session.user.allergies
			?.split(",")
			.map((restriction) => restriction.trim())
			.filter(Boolean) ?? [];

	return (
		<main className="min-h-screen bg-pale-grey px-4 py-6 text-dark-grey sm:px-8 lg:px-12">
			<div className="mx-auto flex w-full max-w-6xl flex-col gap-10">
				<header className="space-y-1">
					<h1 className="font-extrabold text-3xl text-dark-grey">
						Meal Information
					</h1>
					<p className="text-dark-grey/70 text-sm">
						Your meal tickets, dietary restrictions, and upcoming meal times
					</p>
				</header>

				<MealTicket
					displayName={displayName}
					emailAddress={emailAddress}
					userId={session.user.id}
				/>

				<DietaryRestriction dietaryRestrictions={dietaryRestrictions} />

				<MealScheduleSection />
			</div>
		</main>
	);
}
