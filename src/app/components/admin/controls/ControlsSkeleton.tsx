import PageHeader from "@/app/components/PageHeader";
import { Skeleton } from "@/app/components/ui/skeleton";
import { range } from "@/lib/utils";
import { ScoringSectionSkeleton } from "./ScoringSection";

export function ControlsSkeleton() {
	return (
		<section
			aria-busy="true"
			aria-label="Loading admin controls"
			className="flex flex-col gap-6"
		>
			<PageHeader
				description="Reset hackathon, edit scoring components"
				title="Admin Controls"
			/>
			<div className="flex flex-col gap-21">
				<div className="flex flex-col gap-4">
					<h2 className="font-medium text-xl">Set Scoring Categories</h2>
					<div className="flex w-full flex-col gap-16 md:flex-row">
						<ScoringSectionSkeleton name="Scoring Components" />
						<ScoringSectionSkeleton name="Scoring Sidepots" />
					</div>
				</div>
				<div className="flex flex-col gap-4">
					<h2 className="font-medium text-xl">Set Hackathon Dates</h2>
					<div className="flex w-full flex-col gap-4 md:flex-row md:gap-16">
						<Skeleton className="h-17 w-full rounded-[12px]" />
						<Skeleton className="h-17 w-full rounded-[12px]" />
					</div>
				</div>
				<div className="flex w-full flex-col gap-16 md:flex-row">
					<div className="flex w-full flex-col gap-4">
						<h2 className="font-medium text-xl">Action</h2>
						<div className="flex flex-col gap-2">
							{range(2).map((index) => (
								<Skeleton className="h-12 w-48" key={index} />
							))}
						</div>
					</div>
					<div className="flex w-full flex-col gap-4">
						<h2 className="font-medium text-xl">Reset Fields</h2>
						<div className="flex flex-col gap-2">
							{range(4).map((index) => (
								<Skeleton className="h-12 w-40" key={index} />
							))}
						</div>
					</div>
				</div>
				<div className="flex flex-col items-end gap-2 pr-4">
					<Skeleton className="my-0.5 h-4 w-64" />
					<Skeleton className="h-12 w-100 max-w-full rounded-[12px]" />
					<Skeleton className="h-11 w-40" />
				</div>
			</div>
		</section>
	);
}
