import { BannerSkeleton } from "@/app/components/Banner";
import PageHeader from "@/app/components/PageHeader";
import { MealAnalyticsSkeleton } from "./MealAnalytics";
import { MealCheckInsCardSkeleton } from "./MealCheckInsCard";

export function MealsSkeleton() {
	return (
		<section
			aria-busy="true"
			aria-label="Loading meals"
			className="flex flex-col gap-6"
		>
			<PageHeader
				description="Scan meal tickets, see who checked in, and plan for dietary restrictions."
				title="Meals"
			/>
			<BannerSkeleton />
			<MealCheckInsCardSkeleton />
			<MealAnalyticsSkeleton />
		</section>
	);
}
