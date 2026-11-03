import type { Metadata } from "next";
import { RankView } from "@/app/components/judge/rank/RankView";
import { areScoresReleased } from "@/server/api/participant-judging";
import { requireJudge } from "@/server/better-auth/auth-helpers/helpers";
import { api } from "@/trpc/server";

export const metadata: Metadata = {
	title: "Rank finalists | Hack the Change"
};

export default async function RankPage() {
	const { user } = await requireJudge();
	const [settings, assignments] = await Promise.all([
		api.hackathonSettings.get(),
		api.judgingAssignments.getByJudge({ judgeId: user.id })
	]);

	return (
		<RankView
			finalists={assignments.filter(
				(assignment) => assignment.table.round.kind === "final"
			)}
			key={user.id}
			scoresReleased={areScoresReleased(settings)}
		/>
	);
}
