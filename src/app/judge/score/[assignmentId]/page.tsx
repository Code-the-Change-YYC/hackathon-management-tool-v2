import type { Metadata } from "next";
import { ScoreView } from "@/app/components/judge/score/ScoreView";
import { areScoresReleased } from "@/server/api/participant-judging";
import { requireJudge } from "@/server/better-auth/auth-helpers/helpers";
import { api } from "@/trpc/server";

export const metadata: Metadata = {
	title: "Score | Hack the Change"
};

export default async function ScorePage({
	params
}: {
	params: Promise<{ assignmentId: string }>;
}) {
	const [{ assignmentId }, { user }] = await Promise.all([
		params,
		requireJudge()
	]);
	const [settings, assignments, criteria] = await Promise.all([
		api.hackathonSettings.get(),
		api.judgingAssignments.getByJudge({ judgeId: user.id }),
		api.criteria.getAll()
	]);

	return (
		<ScoreView
			assignment={assignments.find(({ id }) => id === assignmentId) ?? null}
			criteria={criteria}
			key={`${user.id}:${assignmentId}`}
			scoresReleased={areScoresReleased(settings)}
			userId={user.id}
		/>
	);
}
