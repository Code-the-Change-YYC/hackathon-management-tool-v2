import PageHeader from "@/app/components/PageHeader";
import { Skeleton } from "@/app/components/ui/skeleton";
import { cn, range } from "@/lib/utils";
import { ManagementSection } from "./judgingShared";
import { ReleaseScoresBanner } from "./ReleaseScoresBanner";

function FieldSkeleton({ className }: { className?: string }) {
	return (
		<div className={cn("flex min-w-0 flex-col gap-2", className)}>
			<Skeleton className="my-0.5 h-4 w-28" />
			<Skeleton className="h-12 rounded-xl" />
		</div>
	);
}

function TableSkeleton({ rows }: { rows: number }) {
	return (
		<div className="mt-6 flex flex-col">
			<Skeleton className="mb-3 h-4 w-1/2" />
			{range(rows).map((row) => (
				<div className="flex items-center gap-6 border-t py-4" key={row}>
					<Skeleton className="h-4 w-1/4" />
					<Skeleton className="h-4 w-1/5" />
					<Skeleton className="ml-auto h-9 w-32" />
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
				description="Create a panel round, generate its tables and times, then pick finalists from the results."
				title="Judging"
			/>
			<ReleaseScoresBanner />
			<ManagementSection
				description="Start here. A panel round’s start and end are the window its schedule must fit in. The final round is created from the panel results below. The active round is the one participants see as in progress."
				id="round-management"
				title="Judging rounds"
			>
				<div className="grid gap-3 lg:grid-cols-[1fr_1fr_1fr_auto] lg:items-end">
					<FieldSkeleton />
					<FieldSkeleton />
					<FieldSkeleton />
					<Skeleton className="h-11 w-28" />
				</div>
				<TableSkeleton rows={2} />
			</ManagementSection>
			<ManagementSection
				description="Set the panel size and timing, check the preview, then generate. Each team presents back-to-back at two tables. After publishing, remove or add teams and move judges without reshuffling anyone else."
				id="panel-schedule"
				title="Panel schedule"
			>
				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
					{range(4).map((field) => (
						<FieldSkeleton key={field} />
					))}
				</div>
				<Skeleton className="mt-6 h-20 rounded-lg" />
				<Skeleton className="mt-6 h-56 rounded-lg" />
			</ManagementSection>
			<ManagementSection
				description="Scoring categories judges see. Set these up before judging starts."
				id="criteria-management"
				title="Judging criteria"
			>
				<div className="grid gap-3 lg:grid-cols-[1fr_160px_160px_auto] lg:items-end">
					<FieldSkeleton />
					<FieldSkeleton />
					<Skeleton className="h-12 rounded-xl" />
					<Skeleton className="h-11 w-28" />
				</div>
				<TableSkeleton rows={4} />
			</ManagementSection>
			<ManagementSection
				description="Teams are ranked by normalized score: each judge’s totals are compared against that judge’s own scores, so a lenient or strict table doesn’t decide who advances. The top teams are pre-selected; adjust the picks, then create the final round."
				id="panel-results"
				title="Panel results"
			>
				<TableSkeleton rows={5} />
			</ManagementSection>
			<ManagementSection
				description="Every judge sits at one table and the finalists present one after another."
				id="final-round"
				title="Final round"
			>
				<TableSkeleton rows={2} />
			</ManagementSection>
		</section>
	);
}
