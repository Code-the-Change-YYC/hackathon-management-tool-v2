import type { Metadata } from "next";
import { ScoreView } from "@/app/components/judge/score/ScoreView";
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
	const [assignments, criteria] = await Promise.all([
		api.judgingAssignments.getByJudge({ judgeId: user.id }),
		api.criteria.getAll()
	]);

	return (
		<ScoreView
			assignment={assignments.find(({ id }) => id === assignmentId) ?? null}
			criteria={criteria}
			key={`${user.id}:${assignmentId}`}
			userId={user.id}
		/>
	);
}
