import type { Metadata } from "next";
import { MealsView } from "@/app/components/admin/meals/MealsView";
import { requireRole } from "@/server/better-auth/auth-helpers/helpers";
import { api } from "@/trpc/server";
import { EventStatus, Role } from "@/types/types";

export const metadata: Metadata = {
	title: "Meals | Hack the Change"
};

export default async function MealsPage() {
	await requireRole([Role.ADMIN]);
	const [meals, ticketsScanned, dietary] = await Promise.all([
		api.meals.getAllMeals(),
		api.events.getMealAttendanceCount(),
		api.users.getDietaryAnalytics()
	]);
	const now = new Date();
	const scannableMeals = meals.filter(
		(meal) => meal.status === EventStatus.ACTIVE && meal.endTime > now
	);
	const scannerMealId =
		scannableMeals[Math.floor(Math.random() * scannableMeals.length)]?.id;

	return (
		<MealsView
			dietary={dietary}
			meals={meals}
			scannerMealId={scannerMealId}
			ticketsScanned={ticketsScanned}
		/>
	);
}
