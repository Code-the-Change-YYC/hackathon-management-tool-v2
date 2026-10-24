"use client";

import { useState } from "react";
import Banner from "@/app/components/Banner";
import MealScannerView from "@/app/components/meal/MealScanner/Meal";
import PageHeader from "@/app/components/PageHeader";
import { Schedule } from "@/app/components/Schedule";
import { Card, CardContent, CardHeader } from "@/app/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle
} from "@/app/components/ui/dialog";
import { useCurrentTime } from "@/hooks/use-current-time";
import type { RouterOutputs } from "@/trpc/react";
import { MealAnalytics } from "./MealAnalytics";
import ScanMealTicketsImages from "./ScanMealTicketsImages";

type Meal = RouterOutputs["meals"]["getAllMeals"][number];

export function MealsView({
	meals,
	scannerMealId,
	ticketsScanned,
	dietary
}: {
	meals: Meal[];
	scannerMealId?: string;
	ticketsScanned: number;
	dietary: RouterOutputs["users"]["getDietaryAnalytics"];
}) {
	const now = useCurrentTime();
	const [isScannerOpen, setIsScannerOpen] = useState(false);
	const scannerMeal = meals.find((meal) => meal.id === scannerMealId);

	return (
		<div className="flex flex-col gap-6">
			<PageHeader
				description="Scan meal tickets, check meal times, and plan for dietary restrictions."
				title="Meals"
			/>
			<Banner
				buttonText="Open scanner"
				colour="purple"
				description={
					scannerMealId
						? "(Recommended for mobile) open this to scan participant meal tickets!"
						: "No active meals are available to scan. Create and activate a food event first."
				}
				image={<ScanMealTicketsImages />}
				onClick={scannerMealId ? () => setIsScannerOpen(true) : undefined}
				title="Scan meal tickets"
			/>
			<Card>
				<CardHeader>
					<h2 className="font-medium text-xl">Meal Schedule</h2>
				</CardHeader>
				<CardContent>
					<Schedule
						emptyDescription="Check back soon for meal times."
						emptyTitle="No meals have been scheduled yet"
						items={meals}
						now={now}
					/>
				</CardContent>
			</Card>
			<MealAnalytics dietary={dietary} ticketsScanned={ticketsScanned} />
			{isScannerOpen && scannerMealId && (
				<Dialog onOpenChange={setIsScannerOpen} open>
					<DialogContent className="h-[min(90dvh,48rem)] grid-rows-[auto_minmax(0,1fr)] overflow-hidden sm:max-w-xl lg:max-w-4xl">
						<DialogHeader>
							<DialogTitle>Scan meal tickets</DialogTitle>
							<DialogDescription>
								{scannerMeal
									? `Meal: ${scannerMeal.title}`
									: "Scan participant meal tickets."}
							</DialogDescription>
						</DialogHeader>
						<MealScannerView mealId={scannerMealId} />
					</DialogContent>
				</Dialog>
			)}
		</div>
	);
}
