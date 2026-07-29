import { requireRole } from "@/server/better-auth/auth-helpers/helpers";
import { api } from "@/trpc/server";
import { Role } from "@/types/types";
import { DietaryRestriction } from "./components/DietaryRestriction";
import {
	getMealStatus,
	MealSchedule,
	type MealScheduleMeal
} from "./components/MealSchedule";
import { MealTicket } from "./components/MealTicket";

const timeFormatter = new Intl.DateTimeFormat("en-US", {
	hour: "numeric",
	minute: "2-digit"
});

type Meal = Awaited<ReturnType<typeof api.meals.getAllMeals>>[number] &
	MealScheduleMeal;

function getTicketMeal(meals: Meal[], now: Date) {
	return (
		meals.find(
			(meal) => meal.startTime.getTime() <= now.getTime() && meal.endTime >= now
		) ??
		meals.find((meal) => meal.startTime > now) ??
		meals[0] ??
		null
	);
}

export default async function MealInfoPage() {
	const session = await requireRole([Role.PARTICIPANT, Role.ADMIN]);
	const displayName = session.user.name?.trim() || "Participant";
	const emailAddress = session.user.email;
	const now = new Date();

	const meals = await api.meals.getAllMeals();

	const ticketMeal = getTicketMeal(meals, now);
	const ticketMealName = ticketMeal?.title ?? "Meal";
	const ticketCopy = ticketMeal
		? `${ticketMealName} is ${getMealStatus(ticketMeal, now).toLowerCase()} until ${timeFormatter.format(ticketMeal.endTime)}.`
		: "Show this QR code to a Code the Change member to receive your meal.";
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
					ticketCopy={ticketCopy}
					ticketMealName={ticketMealName}
					userId={session.user.id}
				/>

				<DietaryRestriction dietaryRestrictions={dietaryRestrictions} />

				<MealSchedule meals={meals} now={now} />
			</div>
		</main>
	);
}
