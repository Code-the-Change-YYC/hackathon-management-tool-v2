import type { Metadata } from "next";
import { AutoRefresh } from "@/app/components/AutoRefresh";
import { JudgingView } from "@/app/components/admin/judging/JudgingView";
import { byNameThenId } from "@/app/components/admin/judging/judgingShared";
import { requireRole } from "@/server/better-auth/auth-helpers/helpers";
import { api } from "@/trpc/server";
import { Role } from "@/types/types";

export const metadata: Metadata = {
	title: "Judging | Hack the Change"
};

export default async function JudgingPage() {
	await requireRole([Role.ADMIN]);
	const [rounds, settings, assignments, users, teams, criteria, rankings] =
		await Promise.all([
			api.judgingRounds.getAll(),
			api.hackathonSettings.get(),
			api.judgingAssignments.getAll(),
			api.users.getAll(),
			api.teams.getAll(),
			api.criteria.getAll(),
			api.teams.getRankings()
		]);
	// Every round's rooms load up front, so switching rounds is instant.
	const layouts = Object.fromEntries(
		await Promise.all(
			rounds.map(async (round) => {
				const layout = await api.judgingRooms.getLayoutByRound({
					roundId: round.id
				});
				return [round.id, layout.rooms] as const;
			})
		)
	);

	return (
		<>
			<AutoRefresh />
			<JudgingView
				activeRoundId={settings?.currentRoundId ?? null}
				assignments={assignments}
				criteria={criteria}
				judges={users
					.filter((user) => user.role === Role.JUDGE)
					.sort(byNameThenId)}
				layouts={layouts}
				rankings={rankings}
				rounds={rounds}
				teams={teams.slice().sort(byNameThenId)}
			/>
		</>
	);
}
