import { JudgeSchedulePage } from "@/app/components/judges/JudgeSchedulePage";
import { requireRole } from "@/server/better-auth/auth-helpers/helpers";
import { api, HydrateClient } from "@/trpc/server";
import { Role } from "@/types/types";

export default async function Page() {
	const session = await requireRole([Role.JUDGE, Role.ADMIN]);
	await Promise.all([
		api.hackathonSettings.get.prefetch(),
		api.judgingRounds.getAll.prefetch(),
		api.judgingAssignments.getByJudge.prefetch({ judgeId: session.user.id }),
		api.criteria.getAll.prefetch()
	]);
	return (
		<HydrateClient>
			<main className="flex flex-col gap-5 px-6 py-6">
				<JudgeSchedulePage />
			</main>
		</HydrateClient>
	);
}
