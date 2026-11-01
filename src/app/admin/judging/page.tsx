import type { Metadata } from "next";
import { AutoRefresh } from "@/app/components/AutoRefresh";
import { JudgingView } from "@/app/components/admin/judging/JudgingView";
import { byNameThenId } from "@/app/components/admin/judging/judgingShared";
import { toHackathonDates } from "@/lib/validation/event";
import { requireRole } from "@/server/better-auth/auth-helpers/helpers";
import { api } from "@/trpc/server";
import { Role } from "@/types/types";

export const metadata: Metadata = {
	title: "Judging | Hack the Change"
};

export default async function JudgingPage() {
	await requireRole([Role.ADMIN]);
	const [rounds, settings, assignments, users, teams, criteria, finalResults] =
		await Promise.all([
			api.judgingRounds.getAll(),
			api.hackathonSettings.get(),
			api.judgingAssignments.getAll(),
			api.users.getAll(),
			api.teams.getAll(),
			api.criteria.getAll(),
			api.judgingResults.getFinalResults()
		]);
	// Every round's tables and rankings load up front, so switching rounds is instant.
	const [layouts, rankings] = await Promise.all([
		Promise.all(
			rounds.map(
				async (round) =>
					[
						round.id,
						await api.judgingTables.getLayoutByRound({ roundId: round.id })
					] as const
			)
		).then(Object.fromEntries),
		Promise.all(
			rounds
				.filter((round) => round.kind === "panel")
				.map(
					async (round) =>
						[
							round.id,
							await api.judgingResults.getPanelRanking({ roundId: round.id })
						] as const
				)
		).then(Object.fromEntries)
	]);

	return (
		<>
			<AutoRefresh />
			<JudgingView
				activeRoundId={settings?.currentRoundId ?? null}
				assignments={assignments}
				criteria={criteria}
				finalResults={finalResults}
				hackathonDates={toHackathonDates(settings)}
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
