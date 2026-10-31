import type { Metadata } from "next";
import { AutoRefresh } from "@/app/components/AutoRefresh";
import { DashboardView } from "@/app/components/judge/dashboard/DashboardView";
import { getNameParts } from "@/lib/names";
import { requireRole } from "@/server/better-auth/auth-helpers/helpers";
import { api } from "@/trpc/server";
import { Role } from "@/types/types";

export const metadata: Metadata = {
	title: "Dashboard | Hack the Change"
};

export default async function DashboardPage() {
	const { user } = await requireRole([Role.JUDGE, Role.ADMIN]);
	const [settings, assignments, criteria] = await Promise.all([
		api.hackathonSettings.get(),
		api.judgingAssignments.getByJudge({ judgeId: user.id }),
		api.criteria.getAll()
	]);

	return (
		<>
			<AutoRefresh />
			<DashboardView
				activeRoundId={settings?.currentRoundId ?? null}
				assignments={assignments}
				criteria={criteria}
				userId={user.id}
				userName={
					user.firstName || getNameParts(user.name).firstName || "Judge"
				}
			/>
		</>
	);
}
