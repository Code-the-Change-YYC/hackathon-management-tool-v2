import { LoadingCard } from "@/app/components/judges/LoadingCard";

export default function Loading() {
	return (
		<main className="flex flex-col gap-5 px-6 py-6">
			<LoadingCard label="Loading rubric…" />
		</main>
	);
}
