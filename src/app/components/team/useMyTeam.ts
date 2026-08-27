"use client";

// Data layer for the My Team view: the getMyTeam query, the team mutations
// (each revalidating the query on success), and the shaped ViewTeam it renders.

import { api } from "@/trpc/react";
import type { TeamMember } from "./MyTeamTable";

export type ViewTeam = {
	id: string;
	name: string;
	teamCode: string;
	maxMembers: number;
	isOwner: boolean;
	members: TeamMember[];
};

export function useMyTeam() {
	const utils = api.useUtils();
	const invalidate = () => utils.teams.getMyTeam.invalidate();

	const query = api.teams.getMyTeam.useQuery();
	const join = api.teams.join.useMutation({ onSuccess: invalidate });
	const create = api.teams.create.useMutation({ onSuccess: invalidate });
	const leave = api.teams.leave.useMutation({ onSuccess: invalidate });
	const update = api.teams.update.useMutation({ onSuccess: invalidate });

	const team = query.data;
	const viewTeam: ViewTeam | null = team
		? {
				id: team.id,
				name: team.name,
				teamCode: team.teamCode ?? "------",
				maxMembers: team.maxMembers,
				isOwner: team.myRole === "owner",
				members: team.members.map((m) => ({
					id: m.id,
					name: m.name,
					email: m.email,
					isYou: m.isYou
				}))
			}
		: null;

	return { query, viewTeam, join, create, leave, update };
}
