"use client";

// "My Team" view (/participant/my-team): shows the team table or, when the
// user has no team, a banner that opens the situation modal (register / join /
// find teammates on Discord). Data and mutations live in useMyTeam.

import { useState } from "react";
import EditTeamNameModal from "./EditTeamNameModal";
import InviteCodeModal from "./InviteCodeModal";
import JoinCodeModal from "./JoinCodeModal";
import JoinedSuccessModal from "./JoinedSuccessModal";
import LeaveTeamModal from "./LeaveTeamModal";
import MyTeamTable from "./MyTeamTable";
import NoTeamBanner from "./NoTeamBanner";
import RegisteredSuccessModal from "./RegisteredSuccessModal";
import RegisterTeamModal from "./RegisterTeamModal";
import SituationModal, { type Situation } from "./SituationModal";
import { useMyTeam } from "./useMyTeam";

type ModalKind =
	| null
	| "situation"
	| "invite"
	| "join"
	| "joined"
	| "leave"
	| "edit"
	| "register"
	| "registered";

const DISCORD_URL = "https://discord.gg/codethechangeyyc";

function joinErrorMessage(
	error: { data?: { code?: string } | null; message: string } | null
) {
	if (!error) return null;
	return error.data?.code === "NOT_FOUND"
		? "No team was found. Please check the code and try again."
		: error.message;
}

export default function MyTeamView() {
	const { query, viewTeam, join, create, leave, update } = useMyTeam();
	const [modal, setModal] = useState<ModalKind>(null);

	function open(next: ModalKind) {
		join.reset();
		create.reset();
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
		<div className="flex flex-col gap-6 p-6">
			<div>
				<h1 className="font-semibold text-[32px] text-grey-800 leading-10">
					My Team
				</h1>
				<p className="font-medium text-[14px] text-grey-600 leading-5">
					Your team name and members
				</p>
			</div>

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
				<MyTeamTable
					canEditName={viewTeam.isOwner}
					maxMembers={viewTeam.maxMembers}
					members={viewTeam.members}
					onEditName={() => open("edit")}
					onInvite={() => open("invite")}
					onLeave={() => open("leave")}
					teamName={viewTeam.name}
				/>
			) : (
				<NoTeamBanner onAction={() => open("situation")} />
			)}

			<SituationModal
				onClose={() => setModal(null)}
				onContinue={handleSituation}
				open={modal === "situation"}
			/>
			<RegisterTeamModal
				error={create.error?.message ?? null}
				loading={create.isPending}
				onClose={() => setModal(null)}
				onSubmit={(name) =>
					create.mutate({ name }, { onSuccess: () => setModal("registered") })
				}
				open={modal === "register"}
			/>
			<RegisteredSuccessModal
				onFinish={() => setModal(null)}
				open={modal === "registered"}
				teamCode={create.data?.teamCode ?? ""}
				teamName={create.data?.name ?? ""}
			/>
			{viewTeam && (
				<InviteCodeModal
					code={viewTeam.teamCode}
					onClose={() => setModal(null)}
					open={modal === "invite"}
				/>
			)}
			<JoinCodeModal
				error={joinErrorMessage(join.error)}
				loading={join.isPending}
				onClose={() => setModal(null)}
				onSubmit={(code) =>
					join.mutate(
						{ teamCode: code },
						{ onSuccess: () => setModal("joined") }
					)
				}
				open={modal === "join"}
			/>
			<JoinedSuccessModal
				onFinish={() => setModal(null)}
				open={modal === "joined"}
				teamName={join.data?.name ?? viewTeam?.name ?? ""}
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
