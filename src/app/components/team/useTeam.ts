"use client";

import { api } from "@/trpc/react";
import type { TeamMember } from "./TeamTable";

export type ViewTeam = {
	id: string;
	name: string;
	teamCode: string;
	maxMembers: number;
	isOwner: boolean;
	members: TeamMember[];
};

export function useTeam() {
	const utils = api.useUtils();
	const refresh = () => utils.teams.getMyTeam.invalidate();

	const query = api.teams.getMyTeam.useQuery();
	const leave = api.teams.leave.useMutation({ onSuccess: refresh });
	const update = api.teams.update.useMutation({ onSuccess: refresh });

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
					avatarSrc: m.avatarSrc,
					isYou: m.isYou
				}))
			}
		: null;

	return { query, viewTeam, refresh, leave, update };
}
