import PageHeader from "@/app/components/PageHeader";
import { Card, CardContent } from "@/app/components/ui/card";
import { Skeleton } from "@/app/components/ui/skeleton";
import { range } from "@/lib/utils";

export function ProfileSkeleton() {
	return (
		<section
			aria-busy="true"
			aria-label="Loading profile"
			className="flex flex-col gap-6"
		>
			<PageHeader title="Profile" />
			<div className="flex items-center gap-4">
				<Skeleton className="size-16 shrink-0 rounded-full" />
				<div className="flex min-w-0 flex-1 flex-col gap-0.5">
					<Skeleton className="my-1 h-5 w-48 max-w-full" />
					<Skeleton className="my-1 h-3 w-64 max-w-full" />
				</div>
			</div>
			<div className="flex flex-col gap-4">
				<div className="flex flex-wrap items-center justify-between gap-2">
					<h2 className="font-medium text-xl">Personal Information</h2>
					<Skeleton className="h-9 w-24" />
				</div>
				<Card>
					<CardContent className="px-6">
						<div className="grid gap-6 sm:grid-cols-2 sm:gap-x-12">
							{range(8).map((index) => (
								<div className="flex flex-col gap-2" key={index}>
									<Skeleton className="my-1 h-3 w-24" />
									<Skeleton className="my-1 h-4 w-40 max-w-full" />
								</div>
							))}
						</div>
					</CardContent>
				</Card>
			</div>
		</section>
	);
}
