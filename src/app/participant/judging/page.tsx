import Link from "next/link";
import { buttonVariants } from "@/app/components/ui/button";
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyTitle
} from "@/app/components/ui/empty";
import { requireRole } from "@/server/better-auth/auth-helpers/helpers";
import { api } from "@/trpc/server";
import { Role } from "@/types/types";
import { JudgingAssignmentCard } from "./components/JudgingAssignmentCard";

export default async function ParticipantJudgingPage() {
	await requireRole([Role.PARTICIPANT, Role.ADMIN]);
	const assignment = await api.judgingAssignments.getMineForActiveRound();

	return (
		<main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-6 sm:p-8">
			<header>
				<h1 className="font-semibold text-3xl">Judging Schedule</h1>
				<p className="mt-2 text-muted-foreground">
					Your team’s assignment for the active judging round.
				</p>
			</header>
			{assignment ? (
				<JudgingAssignmentCard assignment={assignment} />
			) : (
				<Empty className="border">
					<EmptyHeader>
						<EmptyTitle>
							<h2>No judging assignment yet</h2>
						</EmptyTitle>
						<EmptyDescription>
							Your team’s time, room, and meeting link will appear here when an
							assignment is available for the active round.
						</EmptyDescription>
					</EmptyHeader>
					<EmptyContent>
						<Link
							className={buttonVariants({ variant: "outline" })}
							href="/participant/team"
						>
							View your team
						</Link>
					</EmptyContent>
				</Empty>
			)}
		</main>
	);
}
