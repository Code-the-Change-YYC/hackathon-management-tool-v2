import { Card, CardContent } from "@/app/components/ui/card";
import { Skeleton } from "@/app/components/ui/skeleton";

export function LoadingCard({
	label = "Loading judging information…"
}: {
	label?: string;
}) {
	return (
		<Card aria-live="polite">
			<CardContent className="flex min-h-56 flex-col justify-center gap-3">
				<Skeleton className="h-4 w-48" />
				<p className="m-0 text-muted-foreground text-sm">{label}</p>
			</CardContent>
		</Card>
	);
}
