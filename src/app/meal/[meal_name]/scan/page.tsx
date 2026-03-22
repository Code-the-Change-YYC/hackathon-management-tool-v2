import MealScanner from "@/app/components/meal/MealScanner";

export default async function MealPage({
	params
}: {
	params: Promise<{ meal_name: string }>;
}) {
	const { meal_name } = await params;

	return (
		<main className="flex min-h-screen flex-col bg-pale-grey font-sans text-dark-grey">
			<header className="flex items-center justify-between bg-awesomer-purple px-8 py-4 text-white shadow-[0_2px_4px_rgba(0,0,0,0.1)]">
				<h1 className="m-0 font-bold text-2xl">Meal: {meal_name}</h1>
				<span className="ml-4 inline-block rounded-full bg-white/20 px-3 py-1 font-semibold text-sm">
					Admin
				</span>
			</header>
			<div className="mx-auto w-full max-w-md px-4 py-8 sm:px-6">
				<MealScanner />
			</div>
		</main>
	);
}
