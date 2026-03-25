import Meal from "@/app/components/meal/MealScanner/Meal";
import { requireRole } from "@/server/better-auth/auth-helpers/helpers";
import { Role } from "@/types/types";

export default async function MealScanPage({
	params
}: {
	params: Promise<{ meal_name: string }>;
}) {
	await requireRole([Role.JUDGE, Role.ADMIN]);
	const { meal_name } = await params;

	return (
		<main className="flex min-h-screen flex-col bg-pale-grey font-sans text-dark-grey">
			<header className="flex items-center justify-between bg-awesomer-purple px-4 py-3 text-white shadow-[0_2px_4px_rgba(0,0,0,0.1)] sm:px-8 sm:py-4">
				<h1 className="m-0 font-bold text-xl sm:text-2xl">Meal: {meal_name}</h1>
				<span className="ml-4 inline-block rounded-full bg-white/20 px-3 py-1 font-semibold text-sm">
					Admin
				</span>
			</header>
			<div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
				<Meal mealId={meal_name} />
			</div>
		</main>
	);
}
