import { Card } from "@/app/components/ui/card";
import { Skeleton } from "@/app/components/ui/skeleton";
import { range } from "@/lib/utils";
import { JudgeTableCardSkeleton } from "./JudgeTableCard";
import { JudgeTeamRowSkeleton } from "./JudgeTeamRow";

export function DashboardSkeleton() {
	return (
		<section
			aria-busy="true"
			aria-label="Loading dashboard"
			className="flex flex-col gap-6"
		>
			<div className="flex flex-col gap-1">
				<Skeleton className="my-1 h-6 w-48 md:h-7" />
				<Skeleton className="my-1 h-3 w-64 max-w-full" />
			</div>
			<JudgeTableCardSkeleton />
			<div className="flex flex-col gap-3">
				<Skeleton className="my-1 h-5 w-32" />
				<div className="flex gap-1.5">
					{range(4).map((index) => (
						<Skeleton className="h-2 flex-1 rounded-full" key={index} />
					))}
				</div>
				<Card className="py-0">
					<ul className="m-0 list-none divide-y divide-grey-200 p-0">
						{range(4).map((index) => (
							<JudgeTeamRowSkeleton key={index} />
						))}
					</ul>
				</Card>
			</div>
		</section>
	);
}
