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

function SectionHeading({
	title,
	description
}: {
	title: string;
	description: string;
}) {
	return (
		<div>
			<h2 className="font-medium text-xl">{title}</h2>
			<p className="mt-1 mb-0 text-muted-foreground text-sm">{description}</p>
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
				description="Create a round, generate rooms and team slots, then review the schedule."
				title="Judging"
			/>
			<ReleaseScoresBanner />
			<ManagementSection
				description="Start here. Each round is a judging window with a start and end time. Set one as active, then generate rooms below."
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
			<div className="flex flex-col gap-4">
				<SectionHeading
					description="This creates the rooms and places prescreen-passed teams into time slots."
					title="Assign teams to rooms"
				/>
				<div className="grid gap-6 sm:grid-cols-2">
					<FieldSkeleton />
					<FieldSkeleton />
				</div>
				<FieldSkeleton className="max-w-xs" />
				<div className="flex flex-col items-end gap-2">
					<Skeleton className="h-11 w-36" />
					<Skeleton className="my-0.5 h-4 w-64" />
				</div>
			</div>
			<div className="flex flex-col gap-4">
				<SectionHeading
					description="The grid updates after you assign teams to rooms."
					title="Judging schedule"
				/>
				<div className="flex flex-col gap-4 sm:flex-row">
					<FieldSkeleton className="w-full sm:w-64" />
					<FieldSkeleton className="w-full sm:w-64" />
				</div>
				<Skeleton className="h-56 rounded-2xl" />
			</div>
			<div className="mt-4 flex flex-col gap-16">
				<div className="flex flex-col gap-4">
					<SectionHeading
						description="Optional. Edit meeting links, extra rooms, or a single team after generating the schedule."
						title="Adjustments"
					/>
					<ManagementSection
						description="Optional. Add meeting links, extra rooms, or change judges after generating the schedule."
						id="room-management"
						title="Rooms"
					>
						<div className="mb-5 flex items-center justify-between gap-3">
							<Skeleton className="my-0.5 h-4 w-48" />
							<Skeleton className="h-11 w-28" />
						</div>
						<div className="grid gap-4 xl:grid-cols-2">
							<Skeleton className="h-80 rounded-xl" />
							<Skeleton className="h-80 rounded-xl" />
						</div>
					</ManagementSection>
					<ManagementSection
						description="Optional. Move or add a single team after generating the schedule."
						id="assignment-management"
						title="Manual assignments"
					>
						<div className="grid gap-3 lg:grid-cols-[1fr_1fr_1fr_auto] lg:items-end">
							<FieldSkeleton />
							<FieldSkeleton />
							<FieldSkeleton />
							<Skeleton className="h-11 w-36" />
						</div>
						<TableSkeleton rows={3} />
					</ManagementSection>
				</div>
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
					description="Live team totals after scores are submitted."
					id="results-management"
					title="Results"
				>
					<TableSkeleton rows={3} />
				</ManagementSection>
			</div>
		</section>
	);
}
