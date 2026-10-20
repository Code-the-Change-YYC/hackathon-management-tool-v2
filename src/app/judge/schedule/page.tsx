import type { Metadata } from "next";
import { AutoRefresh } from "@/app/components/AutoRefresh";
import { ScheduleView } from "@/app/components/judge/schedule/ScheduleView";
import { requireRole } from "@/server/better-auth/auth-helpers/helpers";
import { api } from "@/trpc/server";
import { Role } from "@/types/types";

export const metadata: Metadata = {
	title: "Schedule | Hack the Change"
};

export default async function SchedulePage() {
	const { user } = await requireRole([Role.JUDGE, Role.ADMIN]);
	const [assignments, criteria] = await Promise.all([
		api.judgingAssignments.getByJudge({ judgeId: user.id }),
		api.criteria.getAll()
	]);

	return (
		<>
			<AutoRefresh />
			<ScheduleView assignments={assignments} criteria={criteria} />
		</>
	);
}
