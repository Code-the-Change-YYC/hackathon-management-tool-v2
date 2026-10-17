import type { Metadata } from "next";
import { DashboardView } from "@/app/components/admin/dashboard/DashboardView";
import { requireRole } from "@/server/better-auth/auth-helpers/helpers";
import { api } from "@/trpc/server";
import { Role } from "@/types/types";

export const metadata: Metadata = {
	title: "Admin Dashboard | Hack the Change"
};

export default async function DashboardPage() {
	await requireRole([Role.ADMIN]);
	const [settings, rounds, users, teams, criteria, rankings] =
		await Promise.all([
			api.hackathonSettings.get(),
			api.judgingRounds.getAll(),
			api.users.getAll(),
			api.teams.getAll(),
			api.criteria.getAll(),
			api.teams.getRankings()
		]);

	return (
		<DashboardView
			criteria={criteria}
			rankings={rankings}
			rounds={rounds}
			settings={settings}
			teams={teams}
			users={users}
		/>
	);
}
