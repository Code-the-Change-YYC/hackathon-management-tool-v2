import { Card } from "@/app/components/ui/card";
import { Skeleton } from "@/app/components/ui/skeleton";
import { DEFAULT_FINALIST_COUNT } from "@/lib/judging";
import { range } from "@/lib/utils";

export function RankSkeleton() {
	return (
		<section
			aria-busy="true"
			aria-label="Loading finalists"
			className="mx-auto flex w-full max-w-2xl flex-col gap-10"
		>
			<div className="-ml-2 flex items-center gap-1">
				<Skeleton className="size-9" />
				<Skeleton className="h-4 w-40" />
			</div>
			<div className="flex flex-col gap-8">
				<div className="flex flex-col gap-3">
					<Skeleton className="my-0.5 h-8 w-56" />
					<Skeleton className="my-1 h-5 w-full" />
				</div>
				<Card className="gap-0 divide-y divide-grey-200 py-0">
					{range(DEFAULT_FINALIST_COUNT).map((index) => (
						<div
							className="flex min-h-18 items-center gap-4 px-4 py-3 sm:px-6"
							key={index}
						>
							<Skeleton className="size-11 rounded-full" />
							<div className="flex flex-1 flex-col gap-1">
								<Skeleton className="h-4 w-40" />
								<Skeleton className="h-3 w-20" />
							</div>
						</div>
					))}
				</Card>
			</div>
		</section>
	);
}
