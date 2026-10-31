import type { Metadata } from "next";
import { TeamsView } from "@/app/components/admin/teams/TeamsView";
import { requireRole } from "@/server/better-auth/auth-helpers/helpers";
import { api } from "@/trpc/server";
import { Role } from "@/types/types";

export const metadata: Metadata = {
	title: "Teams | Hack the Change"
};

export default async function AdminTeamsPage() {
	await requireRole([Role.ADMIN]);

	const teams = await api.teams.getTeamsWithMembers();

	return <TeamsView teams={teams} />;
}
