"use client";

import { Button } from "@/app/components/ui/button";
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyTitle
} from "@/app/components/ui/empty";

export default function JudgingError({ reset }: { reset: () => void }) {
	return (
		<main className="mx-auto w-full max-w-4xl px-4 py-6 sm:p-8">
			<Empty>
				<EmptyHeader>
					<EmptyTitle>
						<h1>Unable to load your judging assignment</h1>
					</EmptyTitle>
					<EmptyDescription>
						We couldn’t retrieve the schedule. Please try again.
					</EmptyDescription>
				</EmptyHeader>
				<EmptyContent>
					<Button onClick={reset}>Try again</Button>
				</EmptyContent>
			</Empty>
		</main>
	);
}
