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

export default async function ParticipantPage() {
	const session = await requireRole([Role.PARTICIPANT, Role.ADMIN]);
	const displayName = session.user.name?.trim() || "Participant";
	const emailAddress = session.user.email;
	const now = new Date();

	const [devpostStatus, meals] = await Promise.all([
		api.teams
			.getMyDevpostSubmissionStatus()
			.catch(
				() =>
					null as Awaited<
						ReturnType<typeof api.teams.getMyDevpostSubmissionStatus>
					> | null
			),
		api.meals.getAllMeals()
	]);

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

				{devpostStatus?.showWarning ? (
					<section className="rounded-lg border border-medium-pink bg-white px-5 py-4 text-dark-grey shadow-[0_10px_30px_rgba(255,107,84,0.08)]">
						<h2 className="font-bold text-grapefruit text-sm uppercase">
							Devpost Submission Required
						</h2>
						<p className="mt-1 text-sm">
							Your team must submit a Devpost link before submissions close.
						</p>
						{devpostStatus.submissionCloseAt ? (
							<p className="mt-1 font-semibold text-sm">
								Submissions close on{" "}
								{devpostStatus.submissionCloseAt.toLocaleString()}.
							</p>
						) : null}
					</section>
				) : null}

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
