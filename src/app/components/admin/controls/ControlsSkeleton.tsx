import PageHeader from "@/app/components/PageHeader";
import { Skeleton } from "@/app/components/ui/skeleton";
import { range } from "@/lib/utils";

const sectionTitle = "font-medium text-[22px] leading-7";

export function ControlsSkeleton() {
	return (
		<section
			aria-busy="true"
			aria-label="Loading admin controls"
			className="flex flex-col gap-6"
		>
			<PageHeader
				description="Create or reset the hackathon"
				title="Admin Controls"
			/>
			<div className="flex flex-col gap-16">
				<div className="flex flex-col gap-4">
					<h2 className={sectionTitle}>Set Hackathon Dates</h2>
					<div className="grid gap-4 md:grid-cols-2 md:gap-16">
						<Skeleton className="h-17 w-full rounded-[12px]" />
						<Skeleton className="h-17 w-full rounded-[12px]" />
					</div>
				</div>
				<div className="grid gap-16 md:grid-cols-2">
					<div className="flex flex-col gap-4">
						<h2 className={sectionTitle}>Hackathon Action</h2>
						<div className="flex flex-col gap-2">
							{range(2).map((index) => (
								<Skeleton className="h-12 w-48" key={index} />
							))}
						</div>
					</div>
					<div className="flex flex-col gap-4">
						<h2 className={sectionTitle}>Reset Fields</h2>
						<div className="flex flex-col gap-2">
							{range(4).map((index) => (
								<Skeleton className="h-12 w-40" key={index} />
							))}
						</div>
					</div>
				</div>
				<div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-end">
					<Skeleton className="h-17 w-full rounded-[12px] md:w-100" />
					<Skeleton className="h-11 w-40 self-end" />
				</div>
			</div>
		</section>
	);
}
