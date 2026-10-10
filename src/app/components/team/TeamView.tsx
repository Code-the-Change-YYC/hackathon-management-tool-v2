"use client";

import { useState } from "react";
import Banner from "@/app/components/Banner";
import type { Situation } from "@/app/components/onboarding/TeamSituationForm";
import PageHeader from "@/app/components/PageHeader";
import { DISCORD_URL } from "@/lib/constants";
import EditTeamNameModal from "./EditTeamNameModal";
import InviteCodeModal from "./InviteCodeModal";
import JoinCodeModal from "./JoinCodeModal";
import LeaveTeamModal from "./LeaveTeamModal";
import NoTeamImages from "./NoTeamImages";
import RegisterTeamModal from "./RegisterTeamModal";
import SituationModal from "./SituationModal";
import SuccessModal from "./SuccessModal";
import TeamTable from "./TeamTable";
import { useTeam } from "./useTeam";

type ModalKind =
	| null
	| "situation"
	| "invite"
	| "join"
	| "joined"
	| "leave"
	| "edit"
	| "register";

export default function TeamView() {
	const { query, viewTeam, refresh, leave, update } = useTeam();
	const [modal, setModal] = useState<ModalKind>(null);

	function open(next: ModalKind) {
		leave.reset();
		update.reset();
		setModal(next);
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

			{query.isLoading ? (
				<div className="h-40 w-full animate-pulse rounded-[12px] bg-grey-100" />
			) : query.isError ? (
				<div className="flex flex-col items-start gap-3 rounded-[12px] border border-red-700/30 bg-red-50 p-6">
					<p className="font-medium text-[16px] text-red-900">
						We couldn't load your team. Please try again.
					</p>
					<button
						className="rounded-full bg-red-700 px-4 py-2 font-medium text-[14px] text-white transition hover:bg-red-900"
						onClick={() => query.refetch()}
						type="button"
					>
						Retry
					</button>
				</div>
			) : viewTeam ? (
				<TeamTable
					canEditName={viewTeam.isOwner}
					maxMembers={viewTeam.maxMembers}
					members={viewTeam.members}
					onEditName={() => open("edit")}
					onInvite={() => open("invite")}
					onLeave={() => open("leave")}
					teamName={viewTeam.name}
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
				onRegistered={async () => {
					// Loads the new team first, so the invite modal has its code.
					await refresh();
					setModal("invite");
				}}
				open={modal === "register"}
			/>
			{viewTeam && (
				<InviteCodeModal
					code={viewTeam.teamCode}
					onClose={() => setModal(null)}
					open={modal === "invite"}
				/>
			)}
			<JoinCodeModal
				onBack={() => setModal("situation")}
				onClose={() => setModal(null)}
				onJoined={async () => {
					// Loads the new team first, so the success modal has its name.
					await refresh();
					setModal("joined");
				}}
				open={modal === "join"}
			/>
			<SuccessModal
				description={`Congrats! You've joined your teammates at ${viewTeam?.name ?? ""} as a registered member!`}
				image="/team/mascot-celebrate.png"
				imageAlt="Teammates celebrating"
				onFinish={() => setModal(null)}
				open={modal === "joined"}
				title={`You've joined ${viewTeam?.name ?? ""}!`}
			/>
			{viewTeam && (
				<LeaveTeamModal
					error={leave.error?.message ?? null}
					loading={leave.isPending}
					onCancel={() => setModal(null)}
					onConfirm={() =>
						leave.mutate(
							{ confirmDelete: true },
							{ onSuccess: () => setModal(null) }
						)
					}
					open={modal === "leave"}
					teamName={viewTeam.name}
				/>
			)}
			{viewTeam && (
				<EditTeamNameModal
					currentName={viewTeam.name}
					error={update.error?.message ?? null}
					loading={update.isPending}
					onClose={() => setModal(null)}
					onSave={(name) =>
						update.mutate(
							{ id: viewTeam.id, name },
							{ onSuccess: () => setModal(null) }
						)
					}
					open={modal === "edit"}
				/>
			)}
		</div>
	);
}
