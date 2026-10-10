import "server-only";

import { redirect } from "next/navigation";
import { ONBOARDING_ROUTES } from "@/lib/routes";
import { api } from "@/trpc/server";
import { MEMBER_ROLES } from "@/types/types";

/** Users already on a team skip ahead to its confirmation screen. */
export async function redirectIfOnTeam() {
	const team = await api.teams.getMyTeam();
	if (team) {
		redirect(
			team.myRole === MEMBER_ROLES.OWNER
				? ONBOARDING_ROUTES.teamRegistered
				: ONBOARDING_ROUTES.teamJoined
		);
	}
}

/** The confirmation screens need a team; without one, go back to the choice. */
export async function requireTeam() {
	const team = await api.teams.getMyTeam();
	if (!team) {
		redirect(ONBOARDING_ROUTES.team);
	}
	return team;
}
