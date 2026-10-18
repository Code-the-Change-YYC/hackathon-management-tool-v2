import type { Metadata } from "next";
import { TeamView } from "@/app/components/participant/team/TeamView";
import { requireRole } from "@/server/better-auth/auth-helpers/helpers";
import { api } from "@/trpc/server";
import { Role } from "@/types/types";

export const metadata: Metadata = {
	title: "Team | Hack the Change"
};

export default async function TeamPage() {
	await requireRole([Role.PARTICIPANT, Role.ADMIN]);
	const team = await api.teams.getMyTeam();

	return <TeamView team={team} />;
}
