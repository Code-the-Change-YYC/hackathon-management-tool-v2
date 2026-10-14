import PageHeader from "@/app/components/PageHeader";
import { Skeleton } from "@/app/components/ui/skeleton";
import { range } from "@/lib/utils";

export function TeamSkeleton() {
	return (
		<section
			aria-busy="true"
			aria-label="Loading your team"
			className="flex flex-col gap-6"
		>
			<PageHeader
				description="Team up, invite teammates, and manage your members."
				title="Team"
			/>
			<div className="@container grid w-full grid-cols-1 overflow-hidden rounded-xl bg-card">
				<div className="flex items-center @md:gap-4 gap-3 bg-accent @md:p-6 p-4">
					<Skeleton className="@md:size-14 size-11 shrink-0 @md:rounded-xl rounded-lg" />
					<div className="flex min-w-0 flex-1 flex-col gap-0.5">
						<Skeleton className="my-1 @md:h-6 @xl:h-7 h-5 w-48 max-w-full" />
						<Skeleton className="my-0.5 h-3 w-20" />
					</div>
				</div>
				{range(3).map((index) => (
					<div
						className="flex items-center @md:gap-4 gap-3 border-t p-4 @md:px-5 @md:py-5"
						key={index}
					>
						<Skeleton className="size-10 shrink-0 rounded-full" />
						<div className="flex min-w-0 flex-1 flex-col gap-0.5">
							<Skeleton className="my-1 h-4 w-36" />
							<Skeleton className="my-0.5 h-3 w-52 max-w-full" />
						</div>
					</div>
				))}
			</div>
		</section>
	);
}
