import { Skeleton } from "@/app/components/ui/skeleton";
import { range } from "@/lib/utils";
import { JudgeRoundStatsSkeleton } from "./JudgeRoundStats";
import { JudgeTeamCardSkeleton } from "./JudgeTeamCard";

export function DashboardSkeleton() {
	return (
		<section
			aria-busy="true"
			aria-label="Loading dashboard"
			className="flex flex-col gap-6"
		>
			<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
				<div className="flex flex-col gap-1">
					<Skeleton className="my-1 h-6 w-48 md:h-7" />
					<Skeleton className="my-1 h-3 w-64 max-w-full" />
				</div>
				<div className="flex flex-col items-start gap-1 sm:items-end">
					<Skeleton className="my-1 h-4 w-56" />
					<Skeleton className="h-11 w-48" />
				</div>
			</div>
			<div className="grid gap-4 xl:grid-cols-2">
				<JudgeRoundStatsSkeleton />
				<JudgeRoundStatsSkeleton />
			</div>
			<div className="flex flex-col gap-4">
				<Skeleton className="my-1 h-5 w-48" />
				<div className="grid gap-4 xl:grid-cols-2">
					{range(4).map((index) => (
						<JudgeTeamCardSkeleton key={index} />
					))}
				</div>
			</div>
		</section>
	);
}
