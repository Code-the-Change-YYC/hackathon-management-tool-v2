import type { ReactNode } from "react";
import { Button } from "@/app/components/ui/button";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyTitle
} from "@/app/components/ui/empty";
import { Skeleton } from "@/app/components/ui/skeleton";

export function DataState({
	loading,
	label = "Loading dashboard",
	error,
	retry,
	children
}: {
	loading: boolean;
	label?: string;
	error: boolean;
	retry: () => void;
	children: ReactNode;
}) {
	if (loading)
		return (
			<section
				aria-busy="true"
				aria-label={label}
				className="flex flex-col gap-4"
			>
				<Skeleton className="h-8 w-2/3" />
				<Skeleton className="h-24 w-full" />
				<Skeleton className="h-24 w-full" />
			</section>
		);
	if (error)
		return (
			<Empty>
				<EmptyHeader>
					<EmptyTitle>Unable to load this section</EmptyTitle>
					<EmptyDescription>Please try again.</EmptyDescription>
				</EmptyHeader>
				<Button onClick={retry} size="sm" variant="outline">
					Try again
				</Button>
			</Empty>
		);
	return children;
}
