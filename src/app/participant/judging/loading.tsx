import PageHeader from "@/app/components/PageHeader";
import { Skeleton } from "@/app/components/ui/skeleton";

export default function Loading() {
	return (
		<section
			aria-busy="true"
			aria-label="Loading judging information"
			className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 md:px-8 xl:px-6"
		>
			<PageHeader title="Judging" titleClassName="text-[32px]/10" />
			<Skeleton className="h-75 w-full sm:h-44" />
			<Skeleton className="h-80 w-full" />
		</section>
	);
}
