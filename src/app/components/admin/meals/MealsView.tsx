"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import Banner from "@/app/components/Banner";
import PageHeader from "@/app/components/PageHeader";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle
} from "@/app/components/ui/dialog";
import { useCurrentTime } from "@/hooks/use-current-time";
import { api, type RouterOutputs } from "@/trpc/react";
import { MealAnalytics } from "./MealAnalytics";
import { MealCheckInsCard } from "./MealCheckInsCard";
import MealScanner from "./MealScanner";
import ScanMealTicketsImages from "./ScanMealTicketsImages";

type MealWithCheckIns = RouterOutputs["meals"]["getMealCheckIns"][number];

export function MealsView({
	meals: initialMeals,
	scannerMealId,
	dietary
}: {
	meals: MealWithCheckIns[];
	scannerMealId?: string;
	dietary: RouterOutputs["users"]["getDietaryAnalytics"];
}) {
	const now = useCurrentTime();
	const [openScannerMeal, setOpenScannerMeal] = useState<{
		id: string;
		title: string;
		lease: string;
	} | null>(null);
	const openingRef = useRef(false);
	const beginScan = api.meals.beginMealScan.useMutation();
	const { data: meals } = api.meals.getMealCheckIns.useQuery(undefined, {
		initialData: initialMeals,
		refetchInterval: 15_000
	});
	const { data: scannerMeal, refetch } = api.meals.getNextMeal.useQuery(
		undefined,
		{
			initialData:
				initialMeals.find((meal) => meal.id === scannerMealId) ?? null,
			refetchInterval: 15_000,
			refetchOnMount: "always"
		}
	);

	const openScanner = async () => {
		if (openingRef.current) return;
		openingRef.current = true;
		try {
			const { data, error } = await refetch();
			if (error) {
				toast.error("Could not check for an available meal. Please try again.");
			} else if (data) {
				try {
					const { lease } = await beginScan.mutateAsync({ eventId: data.id });
					setOpenScannerMeal({ id: data.id, title: data.title, lease });
				} catch (error) {
					toast.error(
						error instanceof Error
							? error.message
							: "Could not open the scanner."
					);
					await refetch();
				}
			}
		} catch {
			toast.error("Could not check for an available meal. Please try again.");
		} finally {
			openingRef.current = false;
		}
	};

	return (
		<div className="flex flex-col gap-6">
			<PageHeader
				description="Scan meal tickets, see who checked in, and plan for dietary restrictions."
				title="Meals"
			/>
			<Banner
				buttonText={scannerMeal ? "Open scanner" : "Check for meal"}
				colour="purple"
				description={
					scannerMeal
						? `Open scanner to scan meal tickets for ${scannerMeal.title}`
						: "No active meals are available to scan. Create and activate a food event first."
				}
				image={<ScanMealTicketsImages />}
				onClick={openScanner}
				title="Scan meal tickets"
			/>
			<MealCheckInsCard meals={meals} now={now} />
			<MealAnalytics dietary={dietary} meals={meals} now={now} />
			{openScannerMeal && (
				<Dialog
					onOpenChange={(open) => {
						if (!open) setOpenScannerMeal(null);
					}}
					open
				>
					<DialogContent className="sm:max-w-md">
						<DialogHeader>
							<DialogTitle>Scan meal tickets</DialogTitle>
							<DialogDescription>
								{`Meal: ${openScannerMeal.title}`}
							</DialogDescription>
						</DialogHeader>
						<div className="mx-auto w-full max-w-80 overflow-hidden rounded-lg">
							<MealScanner
								eventId={openScannerMeal.id}
								scannerLease={openScannerMeal.lease}
							/>
						</div>
					</DialogContent>
				</Dialog>
			)}
		</div>
	);
}
