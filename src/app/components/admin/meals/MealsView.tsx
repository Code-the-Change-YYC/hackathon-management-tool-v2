"use client";

import Banner from "@/app/components/Banner";
import PageHeader from "@/app/components/PageHeader";
import { Schedule } from "@/app/components/Schedule";
import { Card, CardContent, CardHeader } from "@/app/components/ui/card";
import { useCurrentTime } from "@/hooks/use-current-time";
import type { RouterOutputs } from "@/trpc/react";
import { MealAnalytics } from "./MealAnalytics";
import ScanMealTicketsImages from "./ScanMealTicketsImages";

type Meal = RouterOutputs["meals"]["getAllMeals"][number];

export function MealsView({
	meals,
	ticketsScanned,
	dietary
}: {
	meals: Meal[];
	ticketsScanned: number;
	dietary: RouterOutputs["users"]["getDietaryAnalytics"];
}) {
	const now = useCurrentTime();

	return (
		<div className="flex flex-col gap-6">
			<PageHeader
				description="Scan meal tickets, check meal times, and plan for dietary restrictions."
				title="Meals"
			/>
			<Banner
				buttonText="Open scanner"
				colour="purple"
				description="(Recommended for mobile) open this to scan participant meal tickets!"
				href="/meal"
				image={<ScanMealTicketsImages />}
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
		</div>
	);
}
