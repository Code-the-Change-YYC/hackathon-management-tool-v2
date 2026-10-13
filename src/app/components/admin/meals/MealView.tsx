import type { ScheduleItemData } from "@/app/components/ScheduleItem";
import { ScheduleSection } from "@/app/components/ScheduleSection";
import { api } from "@/trpc/server";
import Banner from "../../Banner";
import PageHeader from "../../PageHeader";
import MealAnalytics from "./MealAnalytics";
import ScanMealTicketsImages from "./ScanMealTicketsImages";

export default async function MealView() {
	const events = await api.meals.getAllMeals();
	const now = new Date();

	const scheduleItems: ScheduleItemData[] = events.map((event) => ({
		id: event.id,
		title: event.title,
		startTime: event.startTime,
		endTime: event.endTime,
		eventType: event.type,
		description: event.description
	}));

	return (
		<div className="flex min-h-svh flex-1 flex-col overflow-y-auto bg-white">
			<div className="flex flex-col gap-6 p-6">
				<PageHeader
					description="Your meal tickets, dietary restrictions, and upcoming meal times"
					title="Meal Information"
				/>
				<div className="flex flex-col gap-16">
					<Banner
						buttonText="Open scanner"
						colour="purple"
						description="(Recommended for mobile) open this to scan participant meal tickets!"
						href="/meal"
						image={<ScanMealTicketsImages />}
						title="Scan meal tickets"
					/>
					<ScheduleSection
						emptyDescription="Check back soon for event times."
						emptyTitle="No Events have been scheduled yet."
						items={scheduleItems}
						now={now}
						title="Meal Schedule"
					/>
					<MealAnalytics />
				</div>
			</div>
		</div>
	);
}
