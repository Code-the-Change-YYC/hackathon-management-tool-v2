import PageHeader from "@/app/components/PageHeader";
import { Card, CardContent, CardHeader } from "@/app/components/ui/card";
import { Skeleton } from "@/app/components/ui/skeleton";

export function ImportantInfoSkeleton() {
	return (
		<section
			aria-busy="true"
			aria-label="Loading important information"
			className="flex min-w-0 flex-col gap-6"
		>
			<PageHeader
				description="Rules, code of conduct, project submission steps, and tips for success."
				title="Important Information"
			/>
			<div aria-hidden="true" className="flex flex-col gap-4">
				<Card>
					<CardHeader>
						<Skeleton className="h-5 w-36" />
						<Skeleton className="h-4 w-12" />
					</CardHeader>
					<CardContent className="flex flex-col gap-4">
						{["design", "presentation", "ownership", "team", "figma"].map(
							(key) => (
								<Skeleton className="h-12 w-full" key={key} />
							)
						)}
					</CardContent>
				</Card>
				<div className="flex justify-center gap-2 sm:gap-3">
					<Skeleton className="h-9 w-24" />
					<Skeleton className="h-9 w-28" />
					<Skeleton className="h-9 w-20" />
				</div>
			</div>
			<Card aria-hidden="true">
				<CardHeader>
					<Skeleton className="h-5 w-48 max-w-full" />
					<Skeleton className="h-4 w-3/4" />
				</CardHeader>
				<CardContent className="flex flex-col gap-6">
					{["requirements", "instructions", "submissions", "judging"].map(
						(key) => (
							<div className="flex flex-col gap-2" key={key}>
								<Skeleton className="h-5 w-44 max-w-full" />
								<Skeleton className="h-20 w-full" />
							</div>
						)
					)}
				</CardContent>
			</Card>
		</section>
	);
}
