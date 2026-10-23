import type { Metadata } from "next";
import { ScoreView } from "@/app/components/judge/score/ScoreView";
import { requireRole } from "@/server/better-auth/auth-helpers/helpers";
import { api } from "@/trpc/server";
import { Role } from "@/types/types";

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
		requireRole([Role.JUDGE, Role.ADMIN])
	]);
	const [assignments, criteria] = await Promise.all([
		api.judgingAssignments.getByJudge({ judgeId: user.id }),
		api.criteria.getAll()
	]);

	return (
		<ScoreView
			assignment={assignments.find(({ id }) => id === assignmentId) ?? null}
			criteria={criteria}
			key={assignmentId}
		/>
	);
}
