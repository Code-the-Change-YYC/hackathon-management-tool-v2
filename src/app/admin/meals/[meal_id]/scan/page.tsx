import Meal from "@/app/components/meal/MealScanner/Meal";
import PageHeader from "@/app/components/PageHeader";
import { requireRole } from "@/server/better-auth/auth-helpers/helpers";
import { api } from "@/trpc/server";
import { Role } from "@/types/types";

export default async function MealScanPage({
	params
}: {
	params: Promise<{ meal_id: string }>;
}) {
	await requireRole([Role.ADMIN]);
	const { meal_id } = await params;
	const meal = await api.meals.getMeal({ id: meal_id });

	return (
		<div className="flex flex-col gap-6">
			<PageHeader
				description={meal ? `Meal: ${meal.title}` : undefined}
				title="Scan meal tickets"
			/>
			<Meal mealId={meal_id} />
		</div>
	);
}
