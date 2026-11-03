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
			<Card aria-hidden="true">
				<CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
					<Skeleton className="h-7 w-40" />
					<Skeleton className="h-8 w-full sm:w-80" />
				</CardHeader>
				<CardContent className="flex flex-col gap-4">
					{["design", "presentation", "ownership", "team", "figma"].map(
						(key) => (
							<Skeleton className="h-12 w-full" key={key} />
						)
					)}
				</CardContent>
			</Card>
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
