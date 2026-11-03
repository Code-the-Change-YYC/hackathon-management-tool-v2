"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
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
import { api, type RouterOutputs } from "@/trpc/react";
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
	const [openScannerMeal, setOpenScannerMeal] = useState<{
		id: string;
		title: string;
		lease: string;
	} | null>(null);
	const openingRef = useRef(false);
	const beginScan = api.meals.beginMealScan.useMutation();
	const { data: scannerMeal, refetch } = api.meals.getNextMeal.useQuery(
		undefined,
		{
			initialData: meals.find((meal) => meal.id === scannerMealId) ?? null,
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
				description="Scan meal tickets, check meal times, and plan for dietary restrictions."
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
			{openScannerMeal && (
				<Dialog
					onOpenChange={(open) => {
						if (!open) setOpenScannerMeal(null);
					}}
					open
				>
					<DialogContent className="h-[min(90dvh,48rem)] grid-rows-[auto_minmax(0,1fr)] overflow-hidden sm:max-w-xl lg:max-w-4xl">
						<DialogHeader>
							<DialogTitle>Scan meal tickets</DialogTitle>
							<DialogDescription>
								{`Meal: ${openScannerMeal.title}`}
							</DialogDescription>
						</DialogHeader>
						<MealScannerView
							mealId={openScannerMeal.id}
							scannerLease={openScannerMeal.lease}
						/>
					</DialogContent>
				</Dialog>
			)}
		</div>
	);
}
