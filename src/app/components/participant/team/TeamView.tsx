"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import Banner from "@/app/components/Banner";
import type { Situation } from "@/app/components/onboarding/TeamSituationForm";
import PageHeader from "@/app/components/PageHeader";
import { DISCORD_URL } from "@/lib/constants";
import { api, type RouterOutputs } from "@/trpc/react";
import EditTeamNameModal from "./EditTeamNameModal";
import InviteCodeModal from "./InviteCodeModal";
import JoinCodeModal from "./JoinCodeModal";
import LeaveTeamModal from "./LeaveTeamModal";
import NoTeamImages from "./NoTeamImages";
import RegisterTeamModal from "./RegisterTeamModal";
import SituationModal from "./SituationModal";
import SuccessModal from "./SuccessModal";
import TeamTable from "./TeamTable";

type Team = RouterOutputs["teams"]["getMyTeam"];

type ModalKind =
	| null
	| "situation"
	| "invite"
	| "join"
	| "joined"
	| "leave"
	| "edit"
	| "register";

function getLeaveDescription(team: NonNullable<Team>) {
	if (team.members.length <= 1) {
		return `You're the only member, so leaving will delete ${team.name}. This action can't be undone!`;
	}
	const nextOwner = team.members.find((member) => !member.isYou);
	if (team.myRole === "owner" && nextOwner) {
		return `${nextOwner.name} will become the team owner.`;
	}
	return "This action can't be undone!";
}

export function TeamView({ team }: { team: Team }) {
	const router = useRouter();
	const [isRefreshing, startTransition] = useTransition();
	const [modal, setModal] = useState<ModalKind>(null);
	const leave = api.teams.leave.useMutation();
	const update = api.teams.update.useMutation();

	function open(next: ModalKind) {
		leave.reset();
		update.reset();
		setModal(next);
	}

	// Switches modals once the refreshed team is ready, so the next modal
	// already has its name and invite code.
	function refreshThenShow(next: ModalKind) {
		startTransition(() => {
			router.refresh();
			setModal(next);
		});
	}

	function handleSituation(situation: Situation) {
		if (situation === "registered") return open("join");
		if (situation === "unregistered") return open("register");
		window.open(DISCORD_URL, "_blank");
		setModal(null);
	}

	return (
		<div className="flex flex-col gap-6">
			<PageHeader
				description="Team up, invite teammates, and manage your members."
				title="Team"
			/>

			{team ? (
				<TeamTable
					isOwner={team.myRole === "owner"}
					maxMembers={team.maxMembers}
					members={team.members}
					onEditName={() => open("edit")}
					onInvite={() => open("invite")}
					onLeave={() => open("leave")}
					teamName={team.name}
				/>
			) : (
				<Banner
					buttonText="Join or register a team"
					colour="red"
					description="Form a team of 2-5 members (including yourself!) and register or join your team!"
					image={<NoTeamImages />}
					onClick={() => open("situation")}
					title="You aren't part of a team yet!"
				/>
			)}

			<SituationModal
				onClose={() => setModal(null)}
				onContinue={handleSituation}
				open={modal === "situation"}
			/>
			<RegisterTeamModal
				onBack={() => setModal("situation")}
				onClose={() => setModal(null)}
				onRegistered={() => refreshThenShow("invite")}
				open={modal === "register"}
			/>
			<JoinCodeModal
				onBack={() => setModal("situation")}
				onClose={() => setModal(null)}
				onJoined={() => refreshThenShow("joined")}
				open={modal === "join"}
			/>
			<SuccessModal
				description={`Congrats! You've joined your teammates at ${team?.name ?? ""} as a registered member!`}
				image="/team/mascot-celebrate.png"
				imageAlt="Teammates celebrating"
				onFinish={() => setModal(null)}
				open={modal === "joined"}
				title={`You've joined ${team?.name ?? ""}!`}
			/>
			{team && (
				<>
					<InviteCodeModal
						code={team.teamCode ?? "------"}
						onClose={() => setModal(null)}
						open={modal === "invite"}
					/>
					<LeaveTeamModal
						description={getLeaveDescription(team)}
						error={leave.error?.message ?? null}
						loading={leave.isPending || isRefreshing}
						onCancel={() => setModal(null)}
						onConfirm={() =>
							leave.mutate(undefined, {
								onSuccess: () => refreshThenShow(null)
							})
						}
						open={modal === "leave"}
						teamName={team.name}
					/>
					<EditTeamNameModal
						currentName={team.name}
						error={
							update.error
								? (update.error.data?.zodError?.fieldErrors.name?.[0] ??
									update.error.message)
								: null
						}
						loading={update.isPending || isRefreshing}
						onClose={() => setModal(null)}
						onSave={(name) =>
							update.mutate(
								{ id: team.id, name },
								{ onSuccess: () => refreshThenShow(null) }
							)
						}
						open={modal === "edit"}
					/>
				</>
			)}
		</div>
	);
}
