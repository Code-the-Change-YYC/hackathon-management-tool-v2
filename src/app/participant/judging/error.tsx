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
		<div className="mx-auto w-full max-w-7xl px-4 py-6 sm:p-8">
			<Empty>
				<EmptyHeader>
					<EmptyTitle>
						<h1>Unable to load judging information</h1>
					</EmptyTitle>
					<EmptyDescription>
						We couldn’t retrieve judging information. Please try again.
					</EmptyDescription>
				</EmptyHeader>
				<EmptyContent>
					<Button onClick={reset}>Try again</Button>
				</EmptyContent>
			</Empty>
		</div>
	);
}
