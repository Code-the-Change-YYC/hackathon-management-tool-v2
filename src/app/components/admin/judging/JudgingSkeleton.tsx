import PageHeader from "@/app/components/PageHeader";
import { Skeleton } from "@/app/components/ui/skeleton";
import { range } from "@/lib/utils";
import { ManagementSection } from "./judgingShared";

function TableSkeleton({ rows }: { rows: number }) {
	return (
		<div className="flex flex-col">
			<Skeleton className="mb-3 h-4 w-1/2" />
			{range(rows).map((row) => (
				<div className="flex items-center gap-6 border-t py-4" key={row}>
					<Skeleton className="h-4 w-1/4" />
					<Skeleton className="h-4 w-1/5" />
					<Skeleton className="ml-auto h-4 w-16" />
				</div>
			))}
		</div>
	);
}

export function JudgingSkeleton() {
	return (
		<section
			aria-busy="true"
			aria-label="Loading judging"
			className="flex flex-col gap-6"
		>
			<PageHeader
				description="Schedule each round, publish times to teams, then pick finalists from the results."
				title="Judging"
			/>
			<div className="flex flex-col gap-4">
				<div className="flex items-center justify-between gap-3">
					<Skeleton className="h-9 w-56 rounded-lg" />
					<Skeleton className="h-8 w-28" />
				</div>
				<div className="flex items-center justify-between gap-3">
					<Skeleton className="h-5 w-64" />
					<Skeleton className="h-8 w-40" />
				</div>
			</div>
			<ManagementSection
				action={<Skeleton className="h-8 w-64" />}
				description={<Skeleton className="h-4 w-48" />}
				title="Schedule"
			>
				<TableSkeleton rows={4} />
			</ManagementSection>
			<ManagementSection
				action={<Skeleton className="h-8 w-32" />}
				description={<Skeleton className="h-4 w-72" />}
				title="Rubric"
			>
				<TableSkeleton rows={4} />
			</ManagementSection>
		</section>
	);
}
