import PageHeader from "@/app/components/PageHeader";
import { Skeleton } from "@/app/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function DashboardSkeleton() {
	return (
		<section
			aria-busy="true"
			aria-label="Loading admin dashboard"
			className="flex flex-col gap-6"
		>
			<PageHeader
				description="Manage hackathon settings, users, teams, criteria, and scores."
				title="Admin Dashboard"
			/>
			<Skeleton className="my-1 h-3 w-96 max-w-full" />
			{[
				{ title: "Hackathon Settings", height: "h-43 max-w-4xl" },
				{ title: "Users", height: "h-150" },
				{ title: "Teams", height: "h-150" },
				{ title: "Criteria", height: "h-113" },
				{ title: "Scores", height: "h-150" }
			].map(({ title, height }) => (
				<div className="flex flex-col gap-4" key={title}>
					<h2 className="font-medium text-xl">{title}</h2>
					<Skeleton className={cn("w-full", height)} />
				</div>
			))}
		</section>
	);
}
