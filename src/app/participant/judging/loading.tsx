import PageHeader from "@/app/components/PageHeader";
import { Skeleton } from "@/app/components/ui/skeleton";

export default function Loading() {
	return (
		<section
			aria-busy="true"
			aria-label="Loading judging information"
			className="flex flex-col gap-6"
		>
			<PageHeader title="Judging Information" />
			<Skeleton className="h-75 w-full sm:h-44" />
			<Skeleton className="h-80 w-full" />
		</section>
	);
}
