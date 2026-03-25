import CreateMeal from "@/app/components/meal/CreateMeal/CreateMeal";
import MealsList from "@/app/components/meal/CreateMeal/MealsList";
import { requireRole } from "@/server/better-auth/auth-helpers/helpers";
import { Role } from "@/types/types";

export default async function CreateMealPage() {
	await requireRole([Role.JUDGE, Role.ADMIN]);

	return (
		<main className="flex min-h-screen flex-col bg-pale-grey font-sans text-dark-grey">
			<header className="flex items-center justify-between bg-awesomer-purple px-8 py-4 text-white shadow-[0_2px_4px_rgba(0,0,0,0.1)]">
				<h1 className="m-0 font-bold text-2xl">Meal Portal</h1>
				<span className="ml-4 inline-block rounded-full bg-white/20 px-3 py-1 font-semibold text-sm">
					Admin
				</span>
			</header>
			<div className="mx-auto flex w-full max-w-300 flex-col gap-6 p-8">
				<CreateMeal />
				<MealsList />
			</div>
		</main>
	);
}
