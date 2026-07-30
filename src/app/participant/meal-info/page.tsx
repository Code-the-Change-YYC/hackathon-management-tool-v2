import { getScheduleItemStatus } from "@/app/components/ScheduleItem";
import {
	type ScheduleItemData,
	ScheduleSection
} from "@/app/components/ScheduleSection";
import { requireRole } from "@/server/better-auth/auth-helpers/helpers";
import { api } from "@/trpc/server";
import { Role } from "@/types/types";
import { DietaryRestriction } from "./components/DietaryRestriction";
import { MealTicket } from "./components/MealTicket";

const timeFormatter = new Intl.DateTimeFormat("en-US", {
	hour: "numeric",
	minute: "2-digit"
});

type Meal = Awaited<ReturnType<typeof api.meals.getAllMeals>>[number];

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
	const scheduleItems: ScheduleItemData[] = meals.map((meal) => ({
		id: meal.id,
		title: meal.title,
		startTime: meal.startTime,
		endTime: meal.endTime,
		badgeLabel: "Food",
		description: `Show your meal ticket during this window to check in for ${meal.title.toLowerCase()}.`
	}));

	const ticketMeal = getTicketMeal(meals, now);
	const ticketMealName = ticketMeal?.title ?? "Meal";
	const ticketCopy = ticketMeal
		? `${ticketMealName} is ${getScheduleItemStatus(
				{
					id: ticketMeal.id,
					title: ticketMeal.title,
					startTime: ticketMeal.startTime,
					endTime: ticketMeal.endTime,
					badgeLabel: "Food",
					description: ""
				},
				now
			).toLowerCase()} until ${timeFormatter.format(ticketMeal.endTime)}.`
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

				<ScheduleSection
					emptyDescription="Check back soon for meal times and ticket scanning windows."
					emptyTitle="No meals have been scheduled yet."
					items={scheduleItems}
					now={now}
					title="Meal Schedule"
				/>
			</div>
		</main>
	);
}
