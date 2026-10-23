import { LoadingCard } from "@/app/components/judges/LoadingCard";
import PageHeader from "@/app/components/PageHeader";

export default function Loading() {
	return (
		<main className="flex flex-col gap-5 px-6 py-6">
			<div className="mx-auto flex w-full min-w-0 max-w-6xl flex-col gap-5">
				<PageHeader
					description="Review the criteria and score ranges used for all rounds."
					title="Judging Rubric"
				/>
				<LoadingCard label="Loading rubric…" />
			</div>
		</main>
	);
}
