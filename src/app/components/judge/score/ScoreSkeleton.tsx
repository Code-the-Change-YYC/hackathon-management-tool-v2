import { Skeleton } from "@/app/components/ui/skeleton";
import { MAIN_CRITERION_MAX_SCORE } from "@/lib/judging";
import { range } from "@/lib/utils";

export function ScoreSkeleton() {
	return (
		<section
			aria-busy="true"
			aria-label="Loading scorecard"
			className="mx-auto flex w-full max-w-2xl flex-col gap-10"
		>
			<div className="flex flex-col gap-4">
				<div className="-ml-2 flex items-center gap-1">
					<Skeleton className="size-9" />
					<Skeleton className="h-4 w-40" />
				</div>
				<Skeleton className="h-1.5 w-full rounded-full" />
			</div>
			<div className="flex flex-col gap-8">
				<div className="flex flex-col gap-3">
					<Skeleton className="my-0.5 h-4 w-12" />
					<Skeleton className="my-0.5 h-8 w-56" />
					<div className="flex flex-col gap-2">
						<Skeleton className="my-1 h-5 w-full" />
						<Skeleton className="my-1 h-5 w-3/4" />
					</div>
				</div>
				<div className="grid grid-cols-5 gap-2">
					{range(MAIN_CRITERION_MAX_SCORE).map((index) => (
						<Skeleton className="h-14 sm:h-16" key={index} />
					))}
				</div>
			</div>
		</section>
	);
}
