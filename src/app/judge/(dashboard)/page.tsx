import type { Metadata } from "next";
import { AutoRefresh } from "@/app/components/AutoRefresh";
import { DashboardView } from "@/app/components/judge/dashboard/DashboardView";
import { getNameParts } from "@/lib/names";
import { areScoresReleased } from "@/server/api/participant-judging";
import { requireJudge } from "@/server/better-auth/auth-helpers/helpers";
import { api } from "@/trpc/server";

export const metadata: Metadata = {
	title: "Dashboard | Hack the Change"
};

export default async function DashboardPage() {
	const { user } = await requireJudge();
	const [settings, assignments, criteria, roundSlotTimes] = await Promise.all([
		api.hackathonSettings.get(),
		api.judgingAssignments.getByJudge({ judgeId: user.id }),
		api.criteria.getAll(),
		api.judgingAssignments.getRoundSlotTimes()
	]);

	return (
		<>
			<AutoRefresh />
			<DashboardView
				assignments={assignments}
				criteria={criteria}
				roundSlotTimes={roundSlotTimes}
				scoresReleased={areScoresReleased(settings)}
				userId={user.id}
				userName={
					user.firstName || getNameParts(user.name).firstName || "Judge"
				}
			/>
		</>
	);
}
