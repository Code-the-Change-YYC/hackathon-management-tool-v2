import { Skeleton } from "@/app/components/ui/skeleton";
import { range } from "@/lib/utils";

function RubricBandsSkeleton() {
	return (
		<div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-1">
			{range(5).map((index) => (
				<div
					className="flex flex-col gap-2 rounded-lg border border-grey-200 bg-white p-3"
					key={index}
				>
					<div className="flex items-center gap-2">
						<Skeleton className="my-1 h-6 w-12" />
						<Skeleton className="h-3 w-16" />
					</div>
					<Skeleton className="h-3 w-full" />
					<Skeleton className="h-3 w-full" />
					<Skeleton className="h-3 w-2/3" />
				</div>
			))}
		</div>
	);
}

export function ScoreSkeleton() {
	return (
		<section
			aria-busy="true"
			aria-label="Loading scoring workspace"
			className="flex flex-col"
		>
			<div className="flex flex-col gap-3 border-grey-300 border-b pb-4">
				<p className="m-0 flex gap-1 text-grey-400 text-xs leading-4">
					Dashboard <span>/</span>
					<span className="font-medium text-[#ec1245]">Score</span>
				</p>
				<div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
					<div className="flex min-w-0 flex-1 flex-col gap-4 lg:flex-row lg:items-center">
						<div className="flex min-w-43 flex-col">
							<Skeleton className="my-1 h-4 w-40" />
							<Skeleton className="my-0.5 h-3 w-48" />
						</div>
						<div className="flex gap-2 lg:pl-7">
							{range(4).map((index) => (
								<Skeleton className="h-8 w-28 rounded-full" key={index} />
							))}
						</div>
					</div>
					<div className="flex flex-col items-end gap-1">
						<Skeleton className="h-7 w-14" />
						<Skeleton className="h-2 w-8" />
					</div>
				</div>
			</div>
			<div className="flex w-full max-w-267.75 flex-col gap-6 pt-6">
				<div className="grid w-full gap-6 xl:grid-cols-[minmax(0,728px)_263px]">
					<div className="flex min-w-0 flex-col gap-8 xl:pr-4">
						<div className="flex flex-col gap-6">
							<Skeleton className="my-1.5 h-6 w-56" />
							<div className="flex flex-col gap-2">
								<Skeleton className="my-1 h-4 w-full" />
								<Skeleton className="my-1 h-4 w-3/4" />
							</div>
						</div>
						<div className="flex flex-col gap-3">
							<p className="m-0 font-medium text-[#434343] text-sm uppercase leading-5">
								Score
							</p>
							<div className="flex flex-wrap gap-3">
								{range(10).map((index) => (
									<Skeleton className="h-14 w-15.5 rounded-lg" key={index} />
								))}
							</div>
						</div>
						<div className="xl:hidden">
							<RubricBandsSkeleton />
						</div>
					</div>
					<div className="hidden border-[#eceae5] border-l pl-4 xl:block">
						<RubricBandsSkeleton />
					</div>
				</div>
				<div className="flex flex-col gap-3 py-5 sm:flex-row sm:items-center sm:justify-between">
					<Skeleton className="h-11 w-24" />
					<Skeleton className="h-11 w-24" />
				</div>
			</div>
		</section>
	);
}
