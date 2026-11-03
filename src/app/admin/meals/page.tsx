import type { Metadata } from "next";
import { MealsView } from "@/app/components/admin/meals/MealsView";
import { requireRole } from "@/server/better-auth/auth-helpers/helpers";
import { api } from "@/trpc/server";
import { Role } from "@/types/types";

export const metadata: Metadata = {
	title: "Meals | Hack the Change"
};

export default async function MealsPage() {
	await requireRole([Role.ADMIN]);
	const [meals, nextMeal, ticketsScanned, dietary] = await Promise.all([
		api.meals.getAllMeals(),
		api.meals.getNextMeal(),
		api.events.getMealAttendanceCount(),
		api.users.getDietaryAnalytics()
	]);

	return (
		<MealsView
			dietary={dietary}
			meals={meals}
			scannerMealId={nextMeal?.id}
			ticketsScanned={ticketsScanned}
		/>
	);
}
