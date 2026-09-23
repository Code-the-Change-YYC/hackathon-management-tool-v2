import { Skeleton } from "@/app/components/ui/skeleton";

export default function JudgingLoading() {
	return (
		<main
			aria-busy="true"
			className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-6 sm:p-8"
		>
			<h1 className="font-semibold text-3xl">Judging Schedule</h1>
			<p className="sr-only">Loading your judging assignment…</p>
			<Skeleton className="h-56 w-full rounded-xl" />
		</main>
	);
}
