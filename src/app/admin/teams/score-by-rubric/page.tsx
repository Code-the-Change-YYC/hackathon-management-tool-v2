import type { Metadata } from "next";
import PageHeader from "@/app/components/PageHeader";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyTitle
} from "@/app/components/ui/empty";
import { requireRole } from "@/server/better-auth/auth-helpers/helpers";
import { Role } from "@/types/types";

export const metadata: Metadata = {
	title: "Score by Rubric | Hack the Change"
};

// TODO: Connect to judging's score by rubric page.
export default async function ScoreByRubricPage() {
	await requireRole([Role.ADMIN]);

	return (
		<div className="flex flex-col gap-6">
			<PageHeader title="Score by Rubric" />
			<Empty className="border">
				<EmptyHeader>
					<EmptyTitle>Not available yet</EmptyTitle>
					<EmptyDescription>
						Scores broken down by rubric category will appear here.
					</EmptyDescription>
				</EmptyHeader>
			</Empty>
		</div>
	);
}
