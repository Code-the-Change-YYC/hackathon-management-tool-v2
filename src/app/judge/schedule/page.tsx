import type { Metadata } from "next";
import { AutoRefresh } from "@/app/components/AutoRefresh";
import { ScheduleView } from "@/app/components/judge/schedule/ScheduleView";
import { requireRole } from "@/server/better-auth/auth-helpers/helpers";
import { api } from "@/trpc/server";
import { Role } from "@/types/types";

export const metadata: Metadata = {
	title: "Schedule | Hack the Change"
};

export default async function SchedulePage({
	searchParams
}: {
	searchParams: Promise<{ round?: string }>;
}) {
	const { user } = await requireRole([Role.JUDGE, Role.ADMIN]);
	const [assignments, criteria, rounds, settings, selection] =
		await Promise.all([
			api.judgingAssignments.getByJudge({ judgeId: user.id }),
			api.criteria.getAll(),
			api.judgingRounds.getAll(),
			api.hackathonSettings.get(),
			searchParams
		]);

	return (
		<>
			<AutoRefresh />
			<ScheduleView
				activeRoundId={settings?.currentRoundId ?? null}
				assignments={assignments}
				criteria={criteria}
				initialRoundId={selection.round}
				rounds={rounds}
				updatedAt={Date.now()}
			/>
		</>
	);
}
