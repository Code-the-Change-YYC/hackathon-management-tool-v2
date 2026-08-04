"use client";

/**
 * Top-level "My Team" view rendered on `/participant/my-team`.
 *
 * Loads the current user's team via `api.teams.getMyTeam` and renders
 * either the team table (with modals for invite, join, leave, and edit
 * name) or a "no team" banner that walks the user through the situation
 * modal. For the "no-team" situation, users are pointed at the community
 * Discord to find teammates instead of a modal flow.
 */

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/trpc/react";
import EditTeamNameModal from "./EditTeamNameModal";
import InviteCodeModal from "./InviteCodeModal";
import JoinCodeModal from "./JoinCodeModal";
import JoinedSuccessModal from "./JoinedSuccessModal";
import LeaveTeamModal from "./LeaveTeamModal";
import MyTeamTable, { type TeamMember } from "./MyTeamTable";
import NoTeamBanner from "./NoTeamBanner";
import SituationModal, { type Situation } from "./SituationModal";

type ModalKind =
	| null
	| "situation"
	| "invite"
	| "join"
	| "joined"
	| "leave"
	| "edit";

type ViewTeam = {
	name: string;
	teamCode: string;
	maxMembers: number;
	isOwner: boolean;
	members: TeamMember[];
};

export default function MyTeamView() {
	const router = useRouter();
	const utils = api.useUtils();
	const {
		data: team,
		isLoading,
		isError,
		refetch
	} = api.teams.getMyTeam.useQuery();

	const [modal, setModal] = useState<ModalKind>(null);
	const [joinError, setJoinError] = useState<string | null>(null);
	const [editError, setEditError] = useState<string | null>(null);
	const [leaveError, setLeaveError] = useState<string | null>(null);
	const [joinedTeamName, setJoinedTeamName] = useState("");

	const joinMutation = api.teams.join.useMutation({
		onSuccess: async (joined) => {
			setJoinError(null);
			setJoinedTeamName(joined.name);
			setModal("joined");
			await utils.teams.getMyTeam.invalidate();
		},
		onError: (error) => {
			setJoinError(
				error.data?.code === "NOT_FOUND"
					? "No team was found. Please check the code and try again."
					: error.message
			);
		}
	});

	const leaveMutation = api.teams.leave.useMutation({
		onSuccess: async () => {
			setLeaveError(null);
			setModal(null);
			await utils.teams.getMyTeam.invalidate();
		},
		onError: (error) => setLeaveError(error.message)
	});

	const updateMutation = api.teams.update.useMutation({
		onSuccess: async () => {
			setEditError(null);
			setModal(null);
			await utils.teams.getMyTeam.invalidate();
		},
		onError: (error) => setEditError(error.message)
	});

	const viewTeam: ViewTeam | null = team
		? {
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

	function handleSituation(situation: Situation) {
		if (situation === "registered") {
			setJoinError(null);
			setModal("join");
			return;
		}
		if (situation === "unregistered") {
			router.push("/team/register");
			return;
		}
		window.open("https://discord.gg/codethechangeyyc", "_blank");
		setModal(null);
	}

	return (
		<div className="flex flex-col gap-6 p-6">
			<div>
				<h1 className="font-semibold text-[32px] text-grey-800 leading-10">
					My Team
				</h1>
				<p className="font-medium text-[14px] text-grey-600 leading-5">
					Your team name and members
				</p>
			</div>

			{isLoading ? (
				<div className="h-40 w-full animate-pulse rounded-[12px] bg-grey-100" />
			) : isError ? (
				<div className="flex flex-col items-start gap-3 rounded-[12px] border border-red-700/30 bg-red-50 p-6">
					<p className="font-medium text-[16px] text-red-900">
						We couldn't load your team. Please try again.
					</p>
					<button
						className="rounded-full bg-red-700 px-4 py-2 font-medium text-[14px] text-white transition hover:bg-red-900"
						onClick={() => refetch()}
						type="button"
					>
						Retry
					</button>
				</div>
			) : viewTeam ? (
				<MyTeamTable
					canEditName={viewTeam.isOwner}
					maxMembers={viewTeam.maxMembers}
					members={viewTeam.members}
					onEditName={() => {
						setEditError(null);
						setModal("edit");
					}}
					onInvite={() => setModal("invite")}
					onLeave={() => {
						setLeaveError(null);
						setModal("leave");
					}}
					teamName={viewTeam.name}
				/>
			) : (
				<NoTeamBanner onAction={() => setModal("situation")} />
			)}

			<SituationModal
				onClose={() => setModal(null)}
				onContinue={handleSituation}
				open={modal === "situation"}
			/>
			{viewTeam && (
				<InviteCodeModal
					code={viewTeam.teamCode}
					onClose={() => setModal(null)}
					open={modal === "invite"}
				/>
			)}
			<JoinCodeModal
				error={joinError}
				loading={joinMutation.isPending}
				onClose={() => setModal(null)}
				onSubmit={(code) => joinMutation.mutate({ teamCode: code })}
				open={modal === "join"}
			/>
			<JoinedSuccessModal
				onFinish={() => setModal(null)}
				open={modal === "joined"}
				teamName={joinedTeamName || viewTeam?.name || ""}
			/>
			{viewTeam && (
				<LeaveTeamModal
					error={leaveError}
					loading={leaveMutation.isPending}
					onCancel={() => setModal(null)}
					onConfirm={() => leaveMutation.mutate({ confirmDelete: true })}
					open={modal === "leave"}
					teamName={viewTeam.name}
				/>
			)}
			{viewTeam && (
				<EditTeamNameModal
					currentName={viewTeam.name}
					error={editError}
					loading={updateMutation.isPending}
					onClose={() => setModal(null)}
					onSave={(name) => {
						if (team) {
							updateMutation.mutate({ id: team.id, name });
						}
					}}
					open={modal === "edit"}
				/>
			)}
		</div>
	);
}
